from com_bridge.common_methods import get_robot_name
from com_bridge.common_enums import GlobalConst, LogType, RobotName
import rclpy
from rclpy.node import Node
from nav_msgs.msg import Odometry
from com_bridge.log import LoggerNode
from rclpy.executors import MultiThreadedExecutor
from geometry_msgs.msg import Point, Quaternion
from common_msgs.msg import PoseWithDistance
import numpy as np
from std_srvs.srv import Empty

TIMER_PERIOD = 0.5

class RobotPose(Node):

    def __init__(self):
        super().__init__("robot_pose")
        self.logger = LoggerNode()

        self.declare_parameter("robot_id", "")
        self.robot_id = (
            self.get_parameter("robot_id").get_parameter_value().string_value
        )
        self.robot_name = get_robot_name() or self.robot_id

        self.last_odometry_msg = None
        self.previous_position = None
        self.distance_traveled = 0.0

        odom_topic = f"/{self.robot_id}/odom" if self.robot_name == RobotName.GAZEBO else "/odom"
        self.robot_odom_subscription = self.create_subscription(
            Odometry,
            odom_topic,
            self.odom_callback,
            GlobalConst.QUEUE_SIZE
        )

        pose_with_distance_topic = f"{self.robot_id}/pose_with_distance" if self.robot_name == RobotName.GAZEBO else f"{self.robot_name}/pose_with_distance"

        self.pose_with_distance_publisher = self.create_publisher(PoseWithDistance, pose_with_distance_topic, GlobalConst.QUEUE_SIZE)

        self.timer = self.create_timer(TIMER_PERIOD, self.timer_callback)

        self.logger.log_message(LogType.INFO, f"Robot pose information node launched for {self.robot_name} and subscribed to {odom_topic}")

        self.reset_distance_service = self.create_service(Empty, 'reset_distance_traveled', self.handle_reset_distance_traveled)

    def odom_callback(self, msg: Odometry) -> None:
        current_position = msg.pose.pose.position
        delta_distance = None

        if self.previous_position is not None:
            delta_distance = np.sqrt(
                (current_position.x - self.previous_position.x)**2 +
                (current_position.y - self.previous_position.y)**2
            )

            self.distance_traveled += delta_distance

        self.previous_position = current_position
        self.last_odometry_msg = msg

    def timer_callback(self) -> None:
        if self.should_publish():
            self.publish_pose_with_distance()

    def publish_pose_with_distance(self) -> None:
        position = self.last_odometry_msg.pose.pose.position
        orientation = self.last_odometry_msg.pose.pose.orientation

        pose_with_distance_msg = PoseWithDistance()
        pose_with_distance_msg.pose.position = Point(x=position.x, y=position.y, z=position.z)
        pose_with_distance_msg.pose.orientation = Quaternion(
            x=orientation.x, y=orientation.y, z=orientation.z, w=orientation.w
        )

        pose_with_distance_msg.distance_traveled = self.distance_traveled

        self.pose_with_distance_publisher.publish(pose_with_distance_msg)
        self.last_distance_traveled = self.distance_traveled

    def should_publish(self) -> bool:
        return self.last_odometry_msg is not None and self.distance_traveled is not None

    def handle_reset_distance_traveled(self, request, response):
        self.distance_traveled = 0.0
        self.previous_position = None
        self.last_odometry_msg = None
        self.logger.log_message(LogType.INFO, f"{self.robot_name} traveled distance has been reset.")
        return response


def main(args=None):
    rclpy.init(args=args)
    robot_pose = RobotPose()
    executor = MultiThreadedExecutor()
    executor.add_node(robot_pose)
    try:
        executor.spin()
    finally:
        executor.shutdown()
        robot_pose.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()