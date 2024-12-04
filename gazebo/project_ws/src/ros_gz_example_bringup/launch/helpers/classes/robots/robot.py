from ..core.entity import Entity
from ..core.pose import Pose
from ..core.size import Size
from launch_ros.actions import Node


class Robot(Entity):
    _id = 0
    nodes = []

    def __init__(
        self,
        name="robot",
        model_name="limo_diff_drive",
        pose: Pose = None,
        size: Size = Size(x=0.20, y=0.20, z=0.1),
    ) -> None:
        self.name = name
        self.model_name = model_name
        self.build_entity(pose, size)
        self.index = Robot.get_id()
        self.spawn_robot()
        self.activate_status_simulation()

    @staticmethod
    def get_id() -> int:
        current_id = Robot._id
        Robot._id += 1
        return current_id

    def load_model_sdf(self) -> str:
        robot_desc = Entity.load_model_sdf(self.model_name)

        # Replace template {index} with the current robot index
        robot_desc = robot_desc.replace("{index}", str(self.index + 1))

        return robot_desc

    def create_robot_state_publisher(self) -> None:
        robot_desc = self.load_model_sdf()

        robot_state_publisher = Node(
            package="robot_state_publisher",
            executable="robot_state_publisher",
            name=f"robot_state_publisher",
            namespace=f"{self.name}",
            output="both",
            parameters=[
                {"use_sim_time": True},
                {"robot_description": robot_desc},
            ],
        )

        initial_pose_publisher = Node(
            package="com_bridge",
            executable="publish_initialpose",
            name="initial_pose_publisher",
            output="screen",
            parameters=[
                {"namespace": self.name},
                {"x": self.pose.x},
                {"y": self.pose.y},
            ],
        )

        Robot.nodes.append(robot_state_publisher)
        Robot.nodes.append(initial_pose_publisher)

    def spawn_robot(self) -> Node:
        if Robot.check_spawn_kill(self):
            return

        self.create_robot_state_publisher()

        robot_node = Node(
            package="ros_gz_sim",
            executable="create",
            output="screen",
            arguments=[
                "-topic",
                f"{self.name}/robot_description",
                "-name",
                str(self.name),  # namespace for /tf
                "-x",
                str(self.pose.x),
                "-y",
                str(self.pose.y),
                "-z",
                str(self.pose.z),
                "-R",
                str(self.pose.roll),
                "-P",
                str(self.pose.pitch),
                "-Y",
                str(self.pose.yaw),
            ],
        )

        Entity.spawned_entities_nodes.append(robot_node)
        return robot_node

    @classmethod
    def check_spawn_kill(cls, robot: "Robot") -> bool:
        return super().check_spawn_kill(robot)

    def activate_status_simulation(self) -> None:
        battery_node = Node(
            package="com_bridge",
            executable="mission_status_manager_gazebo",
            name="status",
            parameters=[{"robot_id": f"robot_{self.index + 1}"}],
            output="screen",
        )
        mission_node = Node(
            package="com_bridge",
            executable="mission_controller",
            name="mission_controller",
            parameters=[{"robot_id": self.name}],
            output="screen",
        )
        robot_pose_node = Node(
            package="com_bridge",
            executable="robot_pose",
            name="robot_pose",
            parameters=[{"robot_id": self.name}],
            output="screen",
        )
        sensor_logger_node = Node(
            package="com_bridge",
            executable="sensor_logger",
            name="sensor_logger",
            parameters=[{"robot_id": self.name}],
            output="screen",
        )
        geofence_node = Node(
            package="com_bridge",
            executable="geofence",
            name="geofence",
            parameters=[{"robot_id": self.name}],
            output="screen",
        )

        Robot.nodes.append(battery_node)
        Robot.nodes.append(mission_node)
        Robot.nodes.append(robot_pose_node)
        Robot.nodes.append(geofence_node)
        Robot.nodes.append(sensor_logger_node)
