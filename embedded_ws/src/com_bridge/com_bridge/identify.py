# com_bridge/com_serv.py

from com_bridge.common_enums import GlobalConst, LogType
import rclpy
from rclpy.node import Node
from common_msgs.msg import IdentifyRobot
from std_msgs.msg import String
from geometry_msgs.msg import Twist
import os
import subprocess
from com_bridge.log import LoggerNode


class IdentifyNode(Node):
    def __init__(self):
        super().__init__('identify_node')
        self.logger = LoggerNode()
        self.logger.log_message(LogType.INFO, f"Server Launched waiting for messages in {os.getenv('ROBOT')}")
        self.identification_subscription = self.create_subscription(
            IdentifyRobot,
            f"{os.getenv('ROBOT')}/identify_command",
            self.identification_callback,
            GlobalConst.QUEUE_SIZE
        )

    def identification_callback(self, msg):
        self.logger.log_message(LogType.INFO, f'identification')
        command = ["mpg123", "xmas.mp3"]
        subprocess.run(command, cwd=os.path.expanduser("~/geppetto/embedded_ws/sounds"))

    def destroy_node(self):
        super().destroy_node()

def main(args=None):
    rclpy.init(args=args)
    node = IdentifyNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
