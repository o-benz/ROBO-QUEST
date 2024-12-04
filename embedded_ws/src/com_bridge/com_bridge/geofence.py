from enum import Enum
import os
import subprocess
import sys
import rclpy
from rclpy.node import Node
from rclpy.time import Time
from std_msgs.msg import Bool, Header
from com_bridge.common_enums import GlobalConst, LogType
from com_bridge.log import LoggerNode
from common_msgs.msg import GeofenceBounds, PoseWithDistance
from geometry_msgs.msg import Pose, PoseStamped, Point, Quaternion
from nav2_simple_commander.robot_navigator import BasicNavigator
from ament_index_python.packages import get_package_share_directory
from time import sleep

TIME_TO_GATHER_TOUGHTS = 3
GLOBAL_FRAME_ID = "world"
GEOFENCE_POSE_Z = -0.12
GEOFENCE_SCALE = 2


class GeofenceState(Enum):
    INSIDE = 0
    RETURN_TO_GEOFENCE = 1
    RETURNING = 2


class GeofenceNode(Node):
    def __init__(self) -> None:
        super().__init__("geofence_node")

        self.logger = LoggerNode()

        self.declare_parameter("robot_id", "unknown")
        self.robot_id = (
            self.get_parameter("robot_id").get_parameter_value().string_value
        )

        self.logger.log_message(
            LogType.INFO,
            f"Geofence node initialised for {self.robot_id}. Waiting for bounds!",
        )

        self.logger = LoggerNode()
        self.navigator = BasicNavigator(namespace=self.robot_id)

        self.is_geofence_active = False

        self.state = GeofenceState.INSIDE

        self.exploration_publisher = self.create_publisher(
            Bool, f"/{self.robot_id}/explore/resume", GlobalConst.QUEUE_SIZE
        )

        self.geofence_subscription = self.create_subscription(
            GeofenceBounds,
            "/geofence/bounds",
            self.geofence_bounds_callback,
            GlobalConst.QUEUE_SIZE,
        )

        self.toggle_subscription = self.create_subscription(
            Bool,
            "/geofence/resume",
            self.geofence_toggle_callback,
            GlobalConst.QUEUE_SIZE,
        )

        self.pose_subscription = self.create_subscription(
            PoseWithDistance,
            f"/{self.robot_id}/pose_with_distance",
            self.pose_callback,
            GlobalConst.QUEUE_SIZE,
        )

    def geofence_bounds_callback(self, msg: GeofenceBounds) -> None:
        self.geofence_x_min = msg.x_min
        self.geofence_x_max = msg.x_max
        self.geofence_y_min = msg.y_min
        self.geofence_y_max = msg.y_max

        self.logger.log_message(
            LogType.INFO,
            f"Updated geofence for {self.robot_id}: x_min={self.geofence_x_min}, x_max={self.geofence_x_max}, y_min={self.geofence_y_min}, y_max={self.geofence_y_max}",
        )

        self.spawn_geofence()
        self.activate_geofence()

    def geofence_toggle_callback(self, msg: Bool) -> None:
        if msg.data:
            self.activate_geofence()
        else:
            self.deactivate_geofence()

    def pose_callback(self, msg: PoseWithDistance) -> None:
        self.x = msg.pose.position.x
        self.y = msg.pose.position.y
        self.check_state()

    def activate_geofence(self) -> None:
        self.is_geofence_active = True
        self.logger.log_message(
            LogType.INFO,
            f"Geofence is up and running for {self.robot_id}!",
        )

    def deactivate_geofence(self) -> None:
        self.is_geofence_active = False
        self.logger.log_message(
            LogType.INFO,
            f"Geofence has been taken down for {self.robot_id}!",
        )

    def check_state(self) -> None:
        match self.state:
            case GeofenceState.INSIDE:
                # Check if robot is outside the geofence
                if not self.is_geofence_active:
                    return

                if self.is_outside_geofence(self.x, self.y):
                    self.logger.log_message(
                        LogType.INFO,
                        f"Robot {self.robot_id} is outside the geofence!",
                    )
                    self.state = GeofenceState.RETURN_TO_GEOFENCE

            case GeofenceState.RETURN_TO_GEOFENCE:
                self.pause_exploration()
                self.return_to_geofence()
                self.state = GeofenceState.RETURNING

            case GeofenceState.RETURNING:
                # Check if robot is inside the geofence
                if not self.is_outside_geofence(self.x, self.y):
                    self.navigator.cancelTask()
                    self.logger.log_message(
                        LogType.INFO,
                        f"Robot {self.robot_id} is back inside the geofence!",
                    )
                    self.resume_exploration()
                    self.state = GeofenceState.INSIDE

    def is_outside_geofence(self, x: float, y: float) -> Bool:
        return (
            x < self.geofence_x_min
            or x > self.geofence_x_max
            or y < self.geofence_y_min
            or y > self.geofence_y_max
        )

    def pause_exploration(self) -> None:
        self.logger.log_message(
            LogType.INFO,
            f"Pausing exploration for {self.robot_id}.",
        )
        msg = Bool()
        msg.data = False
        self.exploration_publisher.publish(msg)

    def resume_exploration(self) -> None:
        sleep(TIME_TO_GATHER_TOUGHTS)
        self.logger.log_message(
            LogType.INFO,
            f"Resuming exploration for {self.robot_id}.",
        )
        msg = Bool()
        msg.data = True
        self.exploration_publisher.publish(msg)

    def return_to_geofence(self) -> None:
        sleep(TIME_TO_GATHER_TOUGHTS)
        pose = self.create_pose_stamped(*self.calculate_geofence_midpoint())

        self.navigator.goToPose(pose)
        self.logger.log_message(
            LogType.INFO,
            f"Returning {self.robot_id} inside the geofence",
        )

    def create_pose_stamped(self, target_x: float, target_y: float) -> PoseStamped:
        pose_stamped = PoseStamped()
        pose_stamped.header = Header()
        pose_stamped.header.stamp = Time().to_msg()
        pose_stamped.header.frame_id = GLOBAL_FRAME_ID

        pose_stamped.pose = Pose()
        pose_stamped.pose.position = Point(x=target_x, y=target_y, z=0.0)
        pose_stamped.pose.orientation = Quaternion(x=0.0, y=0.0, z=0.0, w=1.0)
        return pose_stamped

    def calculate_geofence_midpoint(self) -> tuple[float, float]:
        midpoint_x = (self.geofence_x_min + self.geofence_x_max) / 2
        midpoint_y = (self.geofence_y_min + self.geofence_y_max) / 2
        return midpoint_x, midpoint_y

    def load_geofence_sdf(self) -> str:
        try:
            pkg_project_description = get_package_share_directory(
                "ros_gz_example_description"
            )

            sdf_file = os.path.join(
                pkg_project_description, "models", "geofence", "model.sdf"
            )

            if not os.path.isfile(sdf_file):
                raise FileNotFoundError(f"Model file '{sdf_file}' not found.")

            with open(sdf_file, "r") as infp:
                entity_desc = infp.read()

            return entity_desc

        except FileNotFoundError as e:
            print(f"Error: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"Cannot open model file: {e}")
            sys.exit(1)

    def spawn_geofence(self) -> None:
        self.removeGeofence()

        geofence_desc = self.load_geofence_sdf()

        scale_x = abs(self.geofence_x_max - self.geofence_x_min) / GEOFENCE_SCALE
        scale_y = abs(self.geofence_y_max - self.geofence_y_min) / GEOFENCE_SCALE

        geofence_desc = geofence_desc.replace("{scale_x}", str(scale_x))
        geofence_desc = geofence_desc.replace("{scale_y}", str(scale_y))

        pose_x, pose_y = self.calculate_geofence_midpoint()

        command = [
            "ros2",
            "run",
            "ros_gz_sim",
            "create",
            "-name",
            "geofence",
            "-string",
            geofence_desc,
            "-x",
            str(pose_x),
            "-y",
            str(pose_y),
            "-z",
            str(GEOFENCE_POSE_Z),
        ]

        try:
            subprocess.run(command, check=True)
            self.logger.log_message(
                LogType.INFO,
                f"Geofence spawned successfully for {self.robot_id}.",
            )
        except subprocess.CalledProcessError as e:
            self.logger.log_message(
                LogType.ERROR,
                f"Failed to spawn geofence model: {e}",
            )

    def removeGeofence(self):
        command = [
            "ign",
            "service",
            "-s",
            "/world/demo/remove",
            "--reqtype",
            "ignition.msgs.Entity",
            "--reptype",
            "ignition.msgs.Boolean",
            "--req",
            "type: 2 name: 'geofence'",
            "--timeout",
            "100",
        ]

        try:
            subprocess.run(command, check=True)
            self.logger.log_message(
                LogType.INFO,
                f"Geofence removed successfully for {self.robot_id}.",
            )
        except subprocess.CalledProcessError as e:
            self.logger.log_message(
                LogType.ERROR,
                f"Failed to remove geofence model: {e}",
            )


def main(args=None):
    rclpy.init(args=args)
    node = GeofenceNode()
    rclpy.spin(node)
    rclpy.shutdown()


if __name__ == "__main__":
    main()
