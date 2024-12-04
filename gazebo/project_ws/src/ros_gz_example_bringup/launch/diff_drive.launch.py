# Copyright 2022 Open Source Robotics Foundation, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import sys
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, TimerAction
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import PathJoinSubstitution
from launch_ros.actions import Node

# import helpers directory
current_dir = os.path.dirname(__file__)
sys.path.append(current_dir)

ros_gz_bringup_dir = get_package_share_directory("ros_gz_example_bringup")

helpers_dir = os.path.join(
    ros_gz_bringup_dir,
    "helpers",
)
sys.path.append(helpers_dir)

from helpers import *

# Starter entities

robots = [
    Robot(name=name, pose=pose) for name, pose in zip(ROBOT_NAMES, ROBOT_STARTER_POSES)
]

# fmt: off
boundary_walls = [
    Wall(pose=Pose(y= MAP_HEIGHT/2),                                         size=Size(x=MAP_WIDTH,            z=WALL_HEIGHT), starter_wall=True), # west wall
    Wall(pose=Pose(y=-MAP_HEIGHT/2),                                         size=Size(x=MAP_WIDTH,            z=WALL_HEIGHT), starter_wall=True), # east wall
    Wall(pose=Pose(x= MAP_WIDTH/2 - WALL_THICKNESS/2, yaw=HORIZONTAL_YAW),  size=Size(x=MAP_WIDTH - WALL_GAP, z=WALL_HEIGHT), starter_wall=True), # north wall
    Wall(pose=Pose(x=-MAP_WIDTH/2 + WALL_THICKNESS/2, yaw=HORIZONTAL_YAW),  size=Size(x=MAP_WIDTH - WALL_GAP, z=WALL_HEIGHT), starter_wall=True), # south wall
]
# fmt: on

# Spawn random wall obstacles
Wall.generate_random_wall_obstacles(N_WALL_OBSTACLES)


def generate_launch_description():
    # Setup project paths
    pkg_ros_gz_sim = get_package_share_directory("ros_gz_sim")

    # Setup to launch the simulator and Gazebo world
    gz_sim = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_ros_gz_sim, "launch", "gz_sim.launch.py")
        ),
        launch_arguments={
            "gz_args": PathJoinSubstitution(
                [
                    get_package_share_directory("ros_gz_example_gazebo"),
                    "worlds",
                    "diff_drive.sdf",
                ]
            ).perform(None)
            + " -r"
        }.items(),
    )

    # Bridge ROS topics and Gazebo messages for establishing communication
    bridge = Node(
        package="ros_gz_bridge",
        executable="parameter_bridge",
        parameters=[
            {
                "config_file": os.path.join(
                    ros_gz_bringup_dir,
                    "config",
                    "ros_gz_example_bridge.yaml",
                ),
                "qos_overrides./tf_static.publisher.durability": "transient_local",
                "expand_gz_topic_names": True,
            }
        ],
        output="screen",
    )

    update_node = Node(
        package="com_bridge",
        executable="update_code_node",
        name="update_code_node",
        output="screen",
    )

    # map_merge launch file
    map_merge = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(ros_gz_bringup_dir, "launch", "map_merge.launch.py")
        )
    )

    return LaunchDescription(
        [
            gz_sim,
            bridge,
            *Robot.nodes,
            *Entity.spawned_entities_nodes,
            update_node,
            map_merge,
        ]
    )
