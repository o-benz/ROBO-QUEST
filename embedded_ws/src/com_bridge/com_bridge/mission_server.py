import rclpy
import subprocess
import math
from rclpy.node import Node
from geometry_msgs.msg import Twist, PoseStamped
from std_msgs.msg import Bool
from common_msgs.msg import StartMission, StopMission, ReturnBase
from rclpy.executors import MultiThreadedExecutor
from nav2_msgs.action import NavigateToPose
from rclpy.action import ActionClient
from random import uniform
from com_bridge.common_enums import RobotName
from com_bridge.common_methods import (
    clear_logs,
    get_robot_id,
    set_mission_status,
    get_mission_status,
    get_robot_name
)
from com_bridge.common_enums import GlobalConst, LogType, RobotStatus
from com_bridge.log import LoggerNode
import os
import time
import subprocess
from rclpy.parameter import Parameter
from action_msgs.msg import GoalStatusArray
from geometry_msgs.msg import PoseWithCovarianceStamped
from action_msgs.srv import CancelGoal
from std_srvs.srv import Empty



CALLBACK_PERIOD = 2.0


class MissionServerGazebo(Node):
    def __init__(self):
        super().__init__("mission_server")
        self.declare_parameter("robot_id", "")
        self.robot_id = (
            self.get_parameter("robot_id").get_parameter_value().string_value
        )
        self.logger = LoggerNode()
        self.logger.log_message(
            LogType.INFO,
            f"Server Launched waiting for messages in {os.getenv('ROBOT')}",
        )
        self.returning_home = False
        self.initial_pos = None
        self.action_client = ActionClient(self, NavigateToPose, "navigate_to_pose")
        self.start_mission_publisher = self.create_publisher(Bool, 'explore/resume', GlobalConst.QUEUE_SIZE)
        self.start_mission_publisher_limo1 = self.create_publisher(Bool, 'limo1/explore/resume', GlobalConst.QUEUE_SIZE)
        self.start_mission_publisher_limo2 = self.create_publisher(Bool, 'limo2/explore/resume', GlobalConst.QUEUE_SIZE)
        self.base_publisher = self.create_publisher(PoseStamped, '/goal_pose', GlobalConst.QUEUE_SIZE)
        self.first_pos_publisher = self.create_publisher(
            PoseWithCovarianceStamped,
            '/initialpose',
            GlobalConst.QUEUE_SIZE
        )

        self.reset_distance_client = self.create_client(Empty, 'reset_distance_traveled')

        # Subscription pour démarrer et arrêter les missions
        self.start_mission_subscription = self.create_subscription(
            StartMission,
            "start_mission_command",
            self.new_missions_callback,
            GlobalConst.QUEUE_SIZE,
        )

        self.stop_mission_subscription = self.create_subscription(
            StopMission,
            "stop_mission_command",
            self.stop_mission_callback,
            GlobalConst.QUEUE_SIZE,
        )

        self.return_base_subscription = self.create_subscription(
            ReturnBase,
            'return_to_base',
            self.return_to_base_callback,
            GlobalConst.QUEUE_SIZE
        )

        self.nav2_status_subscription = self.create_subscription(
            GoalStatusArray,
            '/navigate_to_pose/_action/status',
            self.nav2_status_callback,
            GlobalConst.QUEUE_SIZE
        )
        time.sleep(2)

        self.mission_mouvements = self.create_publisher(
            Twist, "cmd_vel", GlobalConst.QUEUE_SIZE
        )

    @property
    def mission_active(self):
        if self._mission_status == RobotStatus.LOW_BATTERY:
            return False
        return self._mission_status == RobotStatus.MISSION_ON_GOING

    @property
    def _mission_status(self):
        return get_mission_status()

    @_mission_status.setter
    def _mission_status(self, status):
        set_mission_status(status)

    def new_missions_callback(self, msg: StartMission):
        try:
            if self.mission_active:
                self.logger.log_message(
                    LogType.INFO,
                    "A goal is already being executed. Rejecting new goal request.",
                )
                return
            clear_logs()
            self.publish_initial_pose(msg)
            self._mission_status = RobotStatus.MISSION_ON_GOING
            robot_id = self.robot_id[-1] if self.robot_id else get_robot_id()
            self.logger.log_message(
                LogType.INFO, f"Received new mission for robot {robot_id}"
            )

            if self.reset_distance_client.wait_for_service(timeout_sec=1.0):
                request = Empty.Request()
                self.reset_distance_client.call_async(request)
            else:
                self.logger.log_message(LogType.ERROR, "Reset distance service not available.")

            msg = Bool()
            msg.data = True
            if get_robot_name() == "gazebo":
                command = ["ros2", "launch", "ros_gz_example_bringup", "explore.launch.py"]
                subprocess.Popen(command)
                command = ["ros2", "launch", "ros_gz_example_bringup", "explore.launch2.py"]
                subprocess.Popen(command)

            else:
                self.start_mission_publisher.publish(msg)
                command = ["ros2", "launch", "explore_lite", "explore.launch.py"]
                subprocess.Popen(command)

        except Exception as e:
            self.logger.log_message(LogType.INFO, f"Failed to start mission: {e}")

    def navigate_to_home(self):
        try:
            goal_msg = PoseStamped()
            goal_msg.header.frame_id = 'map'
            goal_msg.header.stamp = self.get_clock().now().to_msg()
            if self.initial_pos is None:
                self.get_logger().error("Initial position is not set. Cannot navigate to base.")
                return
            goal_msg.pose = self.initial_pos.pose.pose
            sound_file = "si_je_revenais_a_la_base.mp3"
            sound_path = os.path.expanduser("~/geppetto/embedded_ws/sounds")
            command = ["mpg123", sound_file]
            subprocess.Popen(command, cwd=sound_path)
            self.base_publisher.publish(goal_msg)
            self.logger.log_message(LogType.INFO, "Navigating to base position.")
        except Exception as e:
            self.logger.log_message(LogType.ERROR, f"Failed to navigate to base: {e}")

    def return_to_base_callback(self, msg: ReturnBase):
        self.stop_robot()
        self.returning_home = True
        time.sleep(1)
        self.navigate_to_home()
        self._mission_status = RobotStatus.WAITING
        returning_home = False



    def nav2_status_callback(self, msg: GoalStatusArray):
        if self._mission_status == RobotStatus.WAITING:
            for status in msg.status_list:
                if status.status == 4:
                    self.get_logger().info("Robot came back home. Wow!!")
                    return
                else:
                    self.get_logger().info(f"Navigation status: {status.status}")

    def stop_mission_callback(self, msg: StopMission):
        try:
            if self.mission_active:
                self.stop_robot()
                self._mission_status = RobotStatus.WAITING
                self.logger.log_message(LogType.INFO, "Current mission canceled.")
            else:
                self.logger.log_message(LogType.INFO, "No active mission to cancel.")
            self._mission_status = RobotStatus.WAITING
        except Exception as e:
            self.logger.log_message(LogType.INFO, f"Failed to cancel mission: {e}")

    def stop_robot(self):
        if self.mission_active:
            msg = Bool()
            msg.data = False
            if get_robot_name() == "gazebo":
                self.start_mission_publisher_limo1.publish(msg)
                self.start_mission_publisher_limo2.publish(msg)
            else:
                self.start_mission_publisher.publish(msg)
            twist_msg = Twist()
            twist_msg.linear.x = 0.0
            twist_msg.linear.y = 0.0
            twist_msg.linear.z = 0.0
            twist_msg.angular.x = 0.0
            twist_msg.angular.y = 0.0
            twist_msg.angular.z = 0.0
            self.mission_mouvements.publish(twist_msg)


    def publish_initial_pose(self, startCoordinates: StartMission):

        initial_pose = PoseWithCovarianceStamped()

        initial_pose.header.stamp = self.get_clock().now().to_msg()
        initial_pose.header.frame_id = 'map'

        if(get_robot_name() == RobotName.ROBOT_1) :
            initial_pose.pose.pose.position.x = float(startCoordinates.mission_details.position1.x)
            initial_pose.pose.pose.position.y = float(startCoordinates.mission_details.position1.y)
            initial_pose.pose.pose.position.z = 0.0
            initial_pose.pose.pose.orientation.w = float(startCoordinates.mission_details.orientation1)
            initial_pose.pose.pose.orientation.z = 1 - float(startCoordinates.mission_details.orientation2)**2

        elif(get_robot_name() == RobotName.ROBOT_2) :
            initial_pose.pose.pose.position.x = float(startCoordinates.mission_details.position2.x)
            initial_pose.pose.pose.position.y = float(startCoordinates.mission_details.position2.y)
            initial_pose.pose.pose.position.z = 0.0
            initial_pose.pose.pose.orientation.w = float(startCoordinates.mission_details.orientation2)
            initial_pose.pose.pose.orientation.z = 1 - float(startCoordinates.mission_details.orientation2)**2


        initial_pose.pose.pose.orientation.x = 0.0
        initial_pose.pose.pose.orientation.y = 0.0


        initial_pose.pose.covariance = [float(x) for x in [
            0.1, 0, 0, 0, 0, 0,
            0, 0.1, 0, 0, 0, 0,
            0, 0, 0.1, 0, 0, 0,
            0, 0, 0, 0.1, 0, 0,
            0, 0, 0, 0, 0.1, 0,
            0, 0, 0, 0, 0, 0.1
        ]]
        self.initial_pos = initial_pose
        self.first_pos_publisher.publish(initial_pose)


def main(args=None):
    rclpy.init(args=args)
    mission_server = MissionServerGazebo()
    executor = MultiThreadedExecutor()
    executor.add_node(mission_server)
    try:
        executor.spin()
    finally:
        executor.shutdown()
        mission_server.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
