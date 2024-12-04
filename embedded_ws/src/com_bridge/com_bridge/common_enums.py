class RobotStatus:
    WAITING = "EN ATTENTE"
    MISSION_ON_GOING = "EN MISSION"
    RETURNING_TO_BASE = "EN RETOUR A LA BASE"
    LOW_BATTERY = "BATTERIE FAIBLE"
    UPDATE = "MISE A JOUR"

class RobotName:
    ROBOT_1 = "robot_1"
    ROBOT_2 = "robot_2"
    GAZEBO = "gazebo"
    
class RobotID:
    ROBOT_1 = "1"
    ROBOT_2 = "2"
    
class GlobalConst:
    QUEUE_SIZE = int(10)
    LOG_QUEUE_SIZE = int(100)
    
class LogType:
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    DEBUG = "DEBUG"

class Network:
    ROS_BRIDGE_PORT = 9090
    ROBOT_1_IP = "lm1354.local"
    ROBOT_2_IP = "lm1170.local"
    RECONNECTION_TIME_INTERVAL = 5.0 