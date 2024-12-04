import os
import rclpy
from rclpy.node import Node
from common_msgs.msg import MissionStatus
from com_bridge.common_methods import get_robot_id, set_mission_status, get_mission_status
from com_bridge.common_enums import GlobalConst, RobotStatus, LogType
from com_bridge.log import LoggerNode
from std_msgs.msg import Bool

TIMER_PERIOD = 1.0
BATTERY_THRESHOLD = 30.0
DECREASE_BATTERY_LEVEL = 0.1
MAX_BATTERY_LEVEL = 100

class MissionStatusManagerGazebo(Node):
    def __init__(self):
        super().__init__("mission_status_manager_gazebo")
        self.declare_parameter("robot_id", "gazebo")
        self.battery_level = MAX_BATTERY_LEVEL
        self.robot_id = (
            self.get_parameter("robot_id").get_parameter_value().string_value
        )
        self.logger = LoggerNode()
        self.logger.log_message(LogType.INFO,
            f"Mission manager Launched waiting for messages in {self.robot_id}"
        )
        self.mission_status_publisher = self.create_publisher(
            MissionStatus, f"{self.robot_id}/mission_status", GlobalConst.QUEUE_SIZE
        )
        self.low_battery_publisher = self.create_publisher(
            Bool,f"{os.getenv('ROBOT')}/low_battery", GlobalConst.QUEUE_SIZE
        )
        self.timer = self.create_timer(TIMER_PERIOD, self.publish_mission_status)

    def decrease_battery_level(self):
        if self.battery_level > BATTERY_THRESHOLD:
            self.battery_level -= DECREASE_BATTERY_LEVEL
        round(self.battery_level)

    def publish_mission_status(self):
        try:
            self.decrease_battery_level()
            mission_status = MissionStatus()
            # TODO: get robot id from gazebo
            mission_status.robot_id = self.robot_id[-1]
            mission_status.battery_level = int(self.battery_level)
            mission_status.robot_status = get_mission_status()
            if (
                mission_status.battery_level <= BATTERY_THRESHOLD
                and mission_status.robot_status != RobotStatus.LOW_BATTERY
            ):
                mission_status.robot_status = RobotStatus.LOW_BATTERY
                set_mission_status(RobotStatus.LOW_BATTERY)
                low_battery_msg = Bool()
                low_battery_msg.data = True 
                self.low_battery_publisher.publish(low_battery_msg)
            self.mission_status_publisher.publish(mission_status)
        except Exception as e:
            self.logger.log_message(LogType.ERROR, "Failed to publish mission status: " + str(e))


def main(args=None):
    rclpy.init(args=args)
    node = MissionStatusManagerGazebo()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == "__main__":
    main()
