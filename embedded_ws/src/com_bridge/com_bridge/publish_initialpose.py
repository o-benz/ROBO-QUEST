import rclpy
from rclpy.node import Node
from geometry_msgs.msg import PoseWithCovarianceStamped

class InitialPosePublisher(Node):
    def __init__(self):
        super().__init__('initial_pose_publisher')

        # Declare parameters with default values
        self.declare_parameter('namespace', 'default_namespace')
        self.declare_parameter('x', 0.0)
        self.declare_parameter('y', 0.0)

        # Retrieve parameter values
        self.namespace = self.get_parameter('namespace').get_parameter_value().string_value
        self.x = self.get_parameter('x').get_parameter_value().double_value
        self.y = self.get_parameter('y').get_parameter_value().double_value

        # Create the publisher
        self.publisher = self.create_publisher(
            PoseWithCovarianceStamped, f'/{self.namespace}/initialpose', 10
        )

        # Timer to publish at regular intervals
        self.timer = self.create_timer(10.0, self.publish_initial_pose)
        self.get_logger().info('Initial Pose Publisher Node started.')

    def publish_initial_pose(self):
        msg = PoseWithCovarianceStamped()
        msg.header.frame_id = f'{self.namespace}/map'
        msg.header.stamp = self.get_clock().now().to_msg()  # Set timestamp

        # Set initial position and orientation
        msg.pose.pose.position.x = self.x
        msg.pose.pose.position.y = self.y
        msg.pose.pose.position.z = 0.0
        msg.pose.pose.orientation.x = 0.0
        msg.pose.pose.orientation.y = 0.0
        msg.pose.pose.orientation.z = 0.0
        msg.pose.pose.orientation.w = 1.0

        # Set covariance
        msg.pose.covariance = [0.25] * 36

        self.publisher.publish(msg)
        self.get_logger().info(f'Published initial pose: x={self.x}, y={self.y}, namespace={self.namespace}')

def main(args=None):
    rclpy.init(args=args)
    node = InitialPosePublisher()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
