import os
from com_bridge.common_enums import RobotID, RobotName
from com_bridge.common_enums import Network

def set_mission_status(mission_status):
    with open('/tmp/.mission_status', 'w') as f:
        f.write(mission_status)

def get_mission_status():
    with open('/tmp/.mission_status', 'r') as f:
        return f.read()

def get_robot_id():
    env_robot = os.getenv('ROBOT')
    robot_id = ""
    if env_robot is not None and env_robot[-1] in [RobotID.ROBOT_1, RobotID.ROBOT_2]:
        robot_id = env_robot[-1]
    else:
        robot_id = env_robot
    return robot_id

def get_robot_name():
    env_robot_name = os.getenv('ROBOT')
    if env_robot_name:
        return env_robot_name
    else:
        return RobotName.GAZEBO

def get_other_robot_name():
    current_robot_name = get_robot_name()
    if current_robot_name == RobotName.ROBOT_1:
        return RobotName.ROBOT_2
    elif current_robot_name == RobotName.ROBOT_2:
        return RobotName.ROBOT_1
    else:
        raise ValueError(f"Unknown robot name: {current_robot_name}")

def get_robot_ip(robot_name: str):
    if robot_name == RobotName.ROBOT_1:
        return Network.ROBOT_1_IP
    elif robot_name == RobotName.ROBOT_2:
        return Network.ROBOT_2_IP
    else:
        raise ValueError(f"Unknown robot name: {robot_name}")

def clear_logs():
    with open('/tmp/mission.log', 'w') as f:
        f.write('')
