from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription(
        [
            Node(
                package="com_bridge",
                executable="mission_controller",
                name="mission_controller",
            ),
            Node(
                package="com_bridge",
                executable="identify_robot",
                name="identify_robot",
            ),
            Node(
                package="com_bridge",
                executable="mission_status_manager",
                name="mission_status_manager",
            ),
            Node(
                package="com_bridge",
                executable="get_map_robot_2",
                name="get_map_robot_2",
            ),
            Node(
                package="com_bridge",
                executable="update_code_node",
                name="update_code_node",
            ),
            Node(
                package="com_bridge",
                executable="robot_pose",
                name="robot_pose",
            ),
            Node(
                package="com_bridge",
                executable="peer_to_peer",
                name="peer_to_peer",
            ),
            Node(
                package="com_bridge",
                executable="sensor_logger",
                name="sensor_logger",
            ),
            Node(
                package="com_bridge",
                executable="low_battery",
                name="low_battery",
            ),
        ]
    )
