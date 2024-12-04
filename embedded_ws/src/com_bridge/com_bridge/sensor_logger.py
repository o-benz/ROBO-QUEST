from com_bridge.common_methods import get_robot_name
from com_bridge.common_enums import GlobalConst, LogType, RobotName
import rclpy
from rclpy.node import Node
from nav_msgs.msg import Odometry
from sensor_msgs.msg import LaserScan
from datetime import datetime
from com_bridge.log import LoggerNode
from rclpy.executors import MultiThreadedExecutor

TIMER_PERIOD = 1.0

class SensorLogger(Node):

    def __init__(self):
        super().__init__("sensor_logger")
        self.logger = LoggerNode()

        self.declare_parameter("robot_id", "")
        self.robot_id = self.get_parameter("robot_id").get_parameter_value().string_value
        self.robot_name = get_robot_name() or self.robot_id

        if not get_robot_name():
            self.logger.log_message(LogType.WARNING, "Robot name not found. Defaulting to robot_id")

        self.last_odometry_msg = None
        self.prev_odometry_msg = None
        self.last_scan_msg = None

        self.subscribe_to_sensor_topics()
        self.logger.log_message(LogType.INFO, f"Sensor Logger Launched waiting for messages in {self.robot_name}")
        self.timer = self.create_timer(TIMER_PERIOD, self.timer_callback)

    def subscribe_to_sensor_topics(self):
        odom_topic = f"/{self.robot_id}/odom" if self.robot_name is RobotName.GAZEBO else "/odom"
        scan_topic = f"/{self.robot_id}/scan" if self.robot_name is RobotName.GAZEBO else "/scan"

        self.robot_odom_subscription = self.create_subscription(
            Odometry,
            odom_topic,
            self.odom_callback,
            GlobalConst.QUEUE_SIZE
        )

        self.robot_scan_subscription = self.create_subscription(
            LaserScan,
            scan_topic,
            self.scan_callback,
            GlobalConst.QUEUE_SIZE
        )

    def odom_callback(self, msg: Odometry):
        self.last_odometry_msg = msg

    def scan_callback(self, msg: LaserScan):
        self.last_scan_msg = msg

    def timer_callback(self):
        if self.should_log():
            self.log_odometry()
            self.log_scan()

    def should_log(self):
        return self.last_odometry_msg is not None and (
            self.prev_odometry_msg is None or self.has_odometry_changed(self.prev_odometry_msg, self.last_odometry_msg)
        )

    def log_odometry(self):
        position = self.last_odometry_msg.pose.pose.position
        orientation = self.last_odometry_msg.pose.pose.orientation
        linear_velocity = self.last_odometry_msg.twist.twist.linear
        angular_velocity = self.last_odometry_msg.twist.twist.angular

        log_message = (
            f"{self.robot_id} Odometry Data:\n"
            f"  Position:\n"
            f"    x: {position.x}\n"
            f"    y: {position.y}\n"
            f"    z: {position.z}\n"
            f"  Orientation:\n"
            f"    x: {orientation.x}\n"
            f"    y: {orientation.y}\n"
            f"    z: {orientation.z}\n"
            f"    w: {orientation.w}\n"
            f"  Linear Velocity:\n"
            f"    x: {linear_velocity.x}\n"
            f"    y: {linear_velocity.y}\n"
            f"    z: {linear_velocity.z}\n"
            f"  Angular Velocity:\n"
            f"    x: {angular_velocity.x}\n"
            f"    y: {angular_velocity.y}\n"
            f"    z: {angular_velocity.z}"
        )
        self.logger.log_message(LogType.INFO, log_message)
        self.prev_odometry_msg = self.last_odometry_msg


    def log_scan(self):
        if self.last_scan_msg:
            center_index = len(self.last_scan_msg.ranges) // 2
            log_distance = self.last_scan_msg.ranges[center_index]
            self.logger.log_message(LogType.INFO, f"{self.robot_id} Center LaserScan distance: {log_distance}")

    def has_odometry_changed(self, prev_msg, curr_msg):
        return (
            prev_msg.pose.pose.position != curr_msg.pose.pose.position or
            prev_msg.pose.pose.orientation != curr_msg.pose.pose.orientation or
            prev_msg.twist.twist != curr_msg.twist.twist
        )


def main(args=None):
    rclpy.init(args=args)
    sensor_logger = SensorLogger()
    executor = MultiThreadedExecutor()
    executor.add_node(sensor_logger)
    try:
        executor.spin()
    finally:
        executor.shutdown()
        sensor_logger.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()