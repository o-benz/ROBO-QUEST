export enum TopicType {
    start_mission = 'common_msgs/msg/StartMission',
    stop_mission = 'common_msgs/msg/StopMission',
    peer_to_peer = 'common_msgs/msg/P2P',
    return_base = 'common_msgs/msg/ReturnBase',
    identify_robot = 'common_msgs/msg/IdentifyRobot',
    mission_status = 'common_msgs/msg/MissionStatus',
    log_message = 'common_msgs/msg/LogMessage',
    map = 'nav_msgs/msg/OccupancyGrid',
    update_code = 'common_msgs/msg/UpdateControllerCode',
    pose = 'geometry_msgs/msg/Pose',
    geofence = 'common_msgs/msg/GeofenceBounds',
    pose_with_distance = 'common_msgs/msg/PoseWithDistance',
}