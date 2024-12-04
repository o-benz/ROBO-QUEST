import asyncio
import json
import websockets
from com_bridge.common_methods import get_other_robot_name, get_robot_ip
from com_bridge.common_enums import Network
from rclpy.node import Node

class WebSocketSubscriber:
    def __init__(self):
        self.robot_ip = get_robot_ip(get_other_robot_name())
        self.ws = None

    async def connect(self):
        """Establish a WebSocket connection to the robot."""
        while True:
            try:
                self.ws = await websockets.connect(f'ws://{self.robot_ip}:{Network.ROS_BRIDGE_PORT}')
                print("Connected to WebSocket successfully!")
                break
            except Exception as error:
                print(f"Failed to connect: {error}. Retrying in {Network.RECONNECTION_TIME_INTERVAL} seconds...")
                await asyncio.sleep(Network.RECONNECTION_TIME_INTERVAL)

    async def subscribe_to_topic(self, topic_name: str, topic_type: str, callback):
        """
        Subscribe to a topic and handle incoming messages with the given callback.

        :param topic_name: Name of the ROS topic to subscribe to.
        :param topic_type: Type of the ROS topic (e.g., 'nav_msgs/msg/OccupancyGrid').
        :param callback: Function to handle incoming messages.
        """
        await self.connect()
        try:
            subscribe_message = {
                'op': 'subscribe',
                'topic': topic_name,
                'type': topic_type,
            }
            await self.ws.send(json.dumps(subscribe_message))
            print(f'Subscribed to topic {topic_name}')
            await self._receive_messages(callback)
        except Exception as error:
            print(f"Subscription to topic {topic_name} failed with error: {error}")

    async def _receive_messages(self, callback):
        """Receive messages from the WebSocket and pass them to the callback."""
        try:
            async for message in self.ws:
                try:
                    message_data = json.loads(message)
                    if 'msg' in message_data:
                        callback(message_data['msg'])
                except json.JSONDecodeError as decode_error:
                    print(f"Error decoding message: {decode_error}")
        except Exception as error:
            print(f"Error receiving messages: {error}")

    async def close(self):
        """Close the WebSocket connection."""
        if self.ws:
            await self.ws.close()
            print("WebSocket connection closed.")
