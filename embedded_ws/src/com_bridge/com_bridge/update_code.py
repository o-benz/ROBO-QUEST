from com_bridge.common_methods import set_mission_status, get_robot_name
from com_bridge.common_enums import GlobalConst, LogType
import rclpy
from rclpy.node import Node
from common_msgs.msg import UpdateControllerCode
import subprocess

import os
import subprocess
from com_bridge.log import LoggerNode


class ModifyCodeNode(Node):
    def __init__(self):
        super().__init__("update_code_node")
        self.logger = LoggerNode()
        self.logger.log_message(
            LogType.INFO,
            f"Update code node Launched waiting for messages in {os.getenv('ROBOT')}",
        )
        self.update_code_subscription = self.create_subscription(
            UpdateControllerCode,
            f"{os.getenv('ROBOT')}/update_code",
            self.update_code_callback,
            GlobalConst.QUEUE_SIZE,
        )
        self.ws_path = (
            "/lib/geppetto/embedded_ws"
            if get_robot_name() == "gazebo"
            else os.path.expanduser("~/geppetto/embedded_ws")
        )
        self.node_dict = {
            "identify.py": "identify_robot",
            "log.py": "log_node",
            "mission_server.py": "mission_server",
            "mission_status_manager.py": "mission_status_manager",
            "mission_status_manager_gazebo.py": "mission_status_manager_gazebo",
            "update_code.py": "update_code_node",
        }

    def stop_node(self, node_name):
        command = f"ps aux | grep '{node_name}' | grep -v grep | awk '{{print $2}}' | while read process; do kill -9 $process; done"
        subprocess.run(command, shell=True)

    def start_node(self, node_name):
        cd_command = f"cd {self.ws_path}"
        build_command = "colcon build --packages-select com_bridge"
        source_command = (
            "source /opt/ros/humble/setup.bash && source install/setup.bash"
        )
        run_command = f"ros2 run com_bridge {node_name}"
        command = f"bash -c '{cd_command} && {build_command} && {source_command} && {run_command}'"
        subprocess.Popen(command, shell=True)

    def update_code_in_file(self, file_path, code):
        try:
            with open(file_path, "w", encoding="utf-8") as file:
                file.write(code)
        except Exception as err:
            print(f"Error writing file: {err}")

    def update_code_callback(self, msg):
        try:
            self.logger.log_message(LogType.INFO, f"Updating code for {msg.filename}")
            path_to_file = self.ws_path + "/src/com_bridge/com_bridge/" + msg.filename
            self.update_code_in_file(path_to_file, msg.code)
            node_name = self.node_dict[msg.filename]
            self.stop_node(node_name)
            self.start_node(node_name)
        except Exception as err:
            print(f"Error occurred while updating code: {err}")


def main(args=None):
    rclpy.init(args=args)
    node = ModifyCodeNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == "__main__":
    main()
