import asyncio
import websockets
import json
import os
from nav_msgs.msg import OccupancyGrid, MapMetaData
from std_msgs.msg import Header
import rclpy
from rclpy.qos import QoSProfile, DurabilityPolicy, ReliabilityPolicy, HistoryPolicy
from rclpy.node import Node
from geometry_msgs.msg import Pose
from com_bridge.common_methods import get_robot_id
from com_bridge.common_enums import RobotID

ROBOT_2_IP = "lm1170.local"
RECONNEXION_TIME_INTERVAL = 5.0 
ROS_BRIDGE_PORT = 9090


class MapPublisher(Node):
    def __init__(self):
        super().__init__('get_map_robot_2')
        qos_profile = QoSProfile(
            depth=1,
            durability=DurabilityPolicy.TRANSIENT_LOCAL,
            reliability=ReliabilityPolicy.RELIABLE,
            history=HistoryPolicy.KEEP_LAST
        )
        self.map2_publisher = self.create_publisher(OccupancyGrid, "robot_2/map", qos_profile)
        self.get_logger().info("Map Publisher node started")


async def retry_connect(publisher_node):
    """Attempt to connect to the WebSocket and retry on failure."""
    while True:
        try:
            async with websockets.connect(f'ws://{ROBOT_2_IP}:{ROS_BRIDGE_PORT}') as ws:
                print("Connected to WebSocket successfully!")
                await subscribe_to_robot_2_topics(ws, publisher_node)
                break  
        except Exception as error:
            print(f"Failed to connect: {error}. Retrying in {RECONNEXION_TIME_INTERVAL} seconds...")
            await asyncio.sleep(RECONNEXION_TIME_INTERVAL) 


async def subscribe_to_robot_2_topics(ws, publisher_node):
    """Subscribe to the robot's map topic once connected."""
    topic_name = '/map'
    topic_type = 'nav_msgs/msg/OccupancyGrid'
    try:
        subscribe_message = {
            'op': 'subscribe',
            'topic': topic_name,
            'type': topic_type,
        }
        await ws.send(json.dumps(subscribe_message))
        print(f'Subscription to topic {topic_name} of robot 2')
        await receive_messages(ws, publisher_node)
    except Exception as error:
        print(f'Subscription to robot 2 failed with error: {error}')


async def receive_messages(ws, publisher_node):
    """Receive and process messages from the WebSocket."""
    try:
        async for message in ws:
            try:
                topic_name = '/map'
                message = json.loads(message)
                message_data = message.get('msg')

                if message.get('topic') == topic_name:
                    occupancy_grid = OccupancyGrid()
                    map_metadata = MapMetaData()
                    info_data = message_data.get('info', {})
                    
                    map_metadata.resolution = info_data.get('resolution')
                    map_metadata.width = info_data.get('width')
                    map_metadata.height = info_data.get('height')

                    origin_data = info_data.get('origin', {})
                    origin = Pose()
                    origin.position.x = origin_data.get('position', {}).get('x')
                    origin.position.y = origin_data.get('position', {}).get('y')
                    origin.position.z = origin_data.get('position', {}).get('z')
                    origin.orientation.x = origin_data.get('orientation', {}).get('x')
                    origin.orientation.y = origin_data.get('orientation', {}).get('y')
                    origin.orientation.z = origin_data.get('orientation', {}).get('z')
                    origin.orientation.w = origin_data.get('orientation', {}).get('w')

                    map_metadata.origin = origin
                    
                    header = Header()
                    header.stamp.sec = message_data.get('header', {}).get('stamp', {}).get('sec')
                    header.stamp.nanosec = message_data.get('header', {}).get('stamp', {}).get('nanosec')
                    header.frame_id = message_data.get('header', {}).get('frame_id')
                    occupancy_grid.header = header
                    
                    occupancy_grid.info = map_metadata
                    occupancy_grid.data = message_data.get('data')
                    
                    
                    publisher_node.map2_publisher.publish(occupancy_grid)
            except json.JSONDecodeError as error:
                print(f'Error processing message from topic {topic_name}: {error}')
    except Exception as e:
        print(f"Connection closed: {e}")


def main():
    if get_robot_id() == RobotID.ROBOT_1:

        rclpy.init()

        publisher_node = MapPublisher()

        loop = asyncio.get_event_loop()

        loop.create_task(retry_connect(publisher_node))

        try:
            loop.run_forever()
        except KeyboardInterrupt:
            pass
        finally:
            loop.close()


if __name__ == "__main__":
    main()
