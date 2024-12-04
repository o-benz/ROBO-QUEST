from com_bridge.common_methods import get_robot_id, get_robot_name
from com_bridge.common_enums import GlobalConst, LogType
import rclpy
from rclpy.node import Node
from common_msgs.msg import LogMessage
from datetime import datetime

class LoggerNode(Node):

    _instance = None  # Variable de classe pour stocker l'instance unique

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(LoggerNode, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        super().__init__("log_node")
        self.robot_id = get_robot_id()
        self.robot_name = get_robot_name()
        self.log_publisher = self.create_publisher(
            LogMessage, f"{self.robot_name}/log", GlobalConst.LOG_QUEUE_SIZE
        )
        self.log_message(LogType.INFO,
            f"Log node Launched waiting for messages in {self.robot_name}"
        )
        self._initialized = True

    def build_log_message(self, log_type, message) -> LogMessage:
        log_message = LogMessage()
        log_message.source = get_robot_name() if get_robot_name() else "Unknown"
        log_message.log_type = log_type
        log_message.date = datetime.now().strftime("%Y-%m-%d %Hh %Mmin %Ss")
        log_message.message = message
        return log_message

    def native_log(self, log_type, message):
        match log_type:
            case LogType.INFO:
                self.get_logger().info(message)
            case LogType.WARNING:
                self.get_logger().warn(message)
            case LogType.ERROR:
                self.get_logger().error(message)
            case LogType.DEBUG:
                self.get_logger().debug(message)

    def log_message(self, log_type, message):
        log_message = self.build_log_message(log_type, message)
        with open("/tmp/mission.log", "a") as f:
            f.write(log_message.source + "\t" + log_message.log_type + "\t" + log_message.date + "\t" + log_message.message + "\n")
        self.log_publisher.publish(log_message)
        self.native_log(log_type, message)


def main(args=None):
    rclpy.init(args=args)
    node = LoggerNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == "__main__":
    main()
