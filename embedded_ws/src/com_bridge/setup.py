from setuptools import find_packages, setup

package_name = "com_bridge"

setup(
    name=package_name,
    version="0.0.0",
    packages=find_packages(exclude=["test"]),
    data_files=[
        ("share/ament_index/resource_index/packages", ["resource/" + package_name]),
        ("share/" + package_name, ["package.xml"]),
        ("share/" + package_name + "/launch", ["launch/com_bridge_launch.py"]),
    ],
    install_requires=["setuptools"],
    zip_safe=True,
    maintainer="root",
    maintainer_email="ely-cheikh.abass@polymtl.ca",
    description="TODO: Package description",
    license="TODO: License declaration",
    tests_require=["pytest"],
    entry_points={
        "console_scripts": [
            "mission_controller = com_bridge.mission_server:main",
            "identify_robot = com_bridge.identify:main",
            "mission_status_manager = com_bridge.mission_status_manager:main",
            "mission_status_manager_gazebo = com_bridge.mission_status_manager_gazebo:main",
            "get_map_robot_2 = com_bridge.get_map_robot_2:main",
            "publish_initialpose = com_bridge.publish_initialpose:main",
            "geofence = com_bridge.geofence:main",
            "update_code_node = com_bridge.update_code:main",
            "low_battery = com_bridge.low_battery:main",
            "robot_pose = com_bridge.robot_pose:main",
            "peer_to_peer = com_bridge.peer_to_peer:main",
            "sensor_logger = com_bridge.sensor_logger:main",
            "negative_elevation = com_bridge.negative_elevation:main",
        ],
    },
)
