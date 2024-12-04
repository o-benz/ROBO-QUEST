import os
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from com_bridge.log import LoggerNode
from com_bridge.common_enums import GlobalConst, LogType
from sensor_msgs.msg import PointCloud2
import sensor_msgs_py.point_cloud2 as pc2
import numpy as np

FALL_THRESHOLD = 0.4
MIN_ACCEPTABLE_ELEVATION = 0.3

class NegativeElevation(Node):
    def __init__(self):
        super().__init__('negative_elevation')
        self.logger = LoggerNode()
        self.logger.log_message(LogType.INFO, f"Negative elevation node launched on {os.getenv('ROBOT')}")
        self.vel_publisher = self.create_publisher(Twist, '/cmd_vel', GlobalConst.QUEUE_SIZE)

        self.point_cloud_subscription = self.create_subscription(
            PointCloud2,
            '/camera/depth/points',
            self.status_elevation_callback,
            GlobalConst.QUEUE_SIZE
        )
        
        # max float value possible
        self.min_elevation = 3.4028234663852886e+38
        
    def status_elevation_callback(self, point_cloud):
        try:
            pc_data = self.extract_points_from_cloud(point_cloud)

            negative_elevation = np.min(pc_data)
            if negative_elevation < self.min_elevation and negative_elevation > MIN_ACCEPTABLE_ELEVATION:
                self.min_elevation = negative_elevation
                self.logger.log_message(LogType.INFO, f"Robot elevation ok! Going forward!")
                self.go_forward()  
            elif abs(negative_elevation - self.min_elevation) > FALL_THRESHOLD:
                self.logger.log_message(LogType.INFO, "Robot elevation too low! Going backward.")
                self.stop_robot()
            else:
                self.logger.log_message(LogType.INFO, f"Robot elevation ok! Going forward!")
                self.go_forward()
                
                

        except Exception as e:
            self.logger.log_message(LogType.INFO, "Failed to calculate negative elevation: "+str(e))

    def extract_points_from_cloud(self, point_cloud):
        pc_data = []
        for point in pc2.read_points(point_cloud, field_names=("x", "y", "z"), skip_nans=True):
            _, _, z = point 
            pc_data.append(z)

        return np.array(pc_data)

    def stop_robot(self):
        vel_msg = Twist()
        vel_msg.linear.x = -0.1
        vel_msg.linear.y = 0.0
        vel_msg.angular.z = 0.0
        self.vel_publisher.publish(vel_msg)
        
    def go_forward(self):
        vel_msg = Twist()
        vel_msg.linear.x = 0.1
        vel_msg.linear.y = 0.0
        vel_msg.angular.z = 0.0
        self.vel_publisher.publish(vel_msg)

        
def main(args=None):
    rclpy.init(args=args)
    node = NegativeElevation()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
