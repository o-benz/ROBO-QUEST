export enum RobotCommand {
    StartMission = 'start_mission',
    EndMission = 'end_mission',
    P2P = 'peer_to_peer',
    IdentifyRobot = 'identify_robot',
    UpdateRobot = 'update',
    ReturnToBase = 'return_to_base',
    GetCodeFile = 'getCodeFile',
    UpdateControllerCode = 'update_controller_code',
    InitiateP2P = 'P2P',
    SetGeofence = 'set_geofence',
    FindFurthestRobot = 'find_furthest'
}