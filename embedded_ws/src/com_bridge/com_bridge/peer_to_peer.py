import math
import rclpy
import asyncio
import signal
from rclpy.node import Node
from dotmap import DotMap
from geometry_msgs.msg import Pose
from common_msgs.msg import P2P
from com_bridge.common_methods import get_robot_name, get_other_robot_name, get_robot_ip
from com_bridge.common_enums import Network
from com_bridge.websocket_subscriber import WebSocketSubscriber  
from os import environ
# To make display accessible from ssh
if "DISPLAY" not in environ:
    environ["DISPLAY"] = ":1"

from gi.repository import AppIndicator3, Gtk, GLib

class Icon:
    INITIAL = "dialog-information-symbolic"
    NEAR = "emblem-ok-symbolic"
    FAR = "dialog-warning-symbolic"

def calculate_cartesian_distance(pose):
    return math.sqrt(pose.position.x ** 2 + pose.position.y ** 2 + pose.position.z ** 2)

class P2PNode(Node):
    def __init__(self):
        super().__init__(f'P2PNode')
        self.robot_name = get_robot_name()
        self.other_robot_name = get_other_robot_name()
        self_robot_topic_pose = f'{self.robot_name}/pose'
        
        self.local_pose_subscriber = self.create_subscription(
            Pose,
            self_robot_topic_pose,
            self.local_pose_callback,
            10
        )

        self.get_logger().info(f"Subscribed succesfully to : {self_robot_topic_pose}")

        self.websocket_subscriber = WebSocketSubscriber()
        self.local_distance = None 
        self.other_distance = None

        self.local_pose_subscriber = self.create_subscription(
            P2P,
            f"/{self.robot_name}/peer_to_peer_command",
            self.peer_to_peer_callback,
            10
        )

        self.p2p_activated = False

        # Icon manager
        self.indicator = AppIndicator3.Indicator.new(
            "dynamic_icon",
            Icon.INITIAL,
            AppIndicator3.IndicatorCategory.APPLICATION_STATUS,
        )
        self.indicator.set_status(AppIndicator3.IndicatorStatus.PASSIVE)
        self.indicator.set_menu(Gtk.Menu())
    
    def peer_to_peer_callback(self, msg):
        if msg.launch == True:
            self.p2p_activated = True
            self.indicator.set_status(AppIndicator3.IndicatorStatus.ACTIVE)
        else:
            self.local_distance = None 
            self.other_distance = None
            self.p2p_activated = False
            self.indicator.set_status(AppIndicator3.IndicatorStatus.PASSIVE)
    

    async def subscribe_to_other_robot_pose(self):
        """
        Subscribe to the other robot's pose topic using WebSocketSubscriber.
        """
        await self.websocket_subscriber.subscribe_to_topic(
            f'/{self.other_robot_name}/pose',
            'geometry_msgs/msg/Pose',
            self.other_robot_pose_callback
        )

    def compare_distances(self):
        """
        Compare distances of the local robot and the other robot.
        Trigger actions based on whether the local robot is the nearest or farthest.
        """
        if self.local_distance is None or self.other_distance is None:
            self.get_logger().info(f"Did not get one of distances: local {self.local_distance} \
            other : {self.other_distance}")
            return

        if self.local_distance > self.other_distance:
            self.get_logger().info("Local robot is the farthest. Showing farthest icon.")
            self.on_farthest_icon()
        else:
            self.get_logger().info("Local robot is the nearest. Showing nearest icon.")
            self.on_nearest_icon()

    def local_pose_callback(self, msg):
        """
        Handle pose updates from the local robot.
        """
        if not self.p2p_activated:
            return
        self.local_distance = calculate_cartesian_distance(msg)
        self.get_logger().info(f"Local robot distance: {self.local_distance}")
        self.compare_distances()

    def other_robot_pose_callback(self, msg):
        """
        Handle pose updates from the other robot.
        """
        if not self.p2p_activated:
            return
        msg = DotMap(msg)
        self.other_distance = calculate_cartesian_distance(msg)
        self.get_logger().info(f"Other robot distance: {self.other_distance}")
        self.compare_distances()

    def on_farthest_icon(self):
        self.indicator.set_icon(Icon.FAR)
        self.get_logger().info("Changing icon for the farthest robot.")

    def on_nearest_icon(self):
        self.indicator.set_icon(Icon.NEAR)
        self.get_logger().info("Changing icon for the nearest robot.")

    async def shutdown(self):
        """
        Close WebSocket connection on shutdown.
        """
        await self.websocket_subscriber.close()

async def spin_ros_node(node: P2PNode, sleep_interval: float = 0.1):
    """
    Asynchronously spin a ROS 2 node, processing its callbacks.
    :param node: The ROS 2 node to spin.
    :param sleep_interval: Time to sleep between spin iterations, in seconds.
    """
    while rclpy.ok():
        rclpy.spin_once(node, timeout_sec=0)
        await asyncio.sleep(sleep_interval)


async def main_async():
    rclpy.init()
    node = P2PNode()
    # Handle SIGINT (Ctrl+C) gracefully
    signal.signal(signal.SIGINT, signal.SIG_DFL)
    main_loop = GLib.MainLoop()  # Create a GLib main loop for GTK
    try:
        loop = asyncio.get_event_loop()
        loop.create_task(spin_ros_node(node))
        loop.create_task(node.subscribe_to_other_robot_pose())
        # Run GLib MainLoop within the asyncio context
        await loop.run_in_executor(None, main_loop.run)
    except KeyboardInterrupt:
        print("Shutting down node...")
    finally:
        await node.shutdown()
        rclpy.shutdown()
        main_loop.quit()

def main():
    asyncio.run(main_async())


if __name__ == '__main__':
    main()
