export interface RobotPose {
    position: { x: number; y: number; z: number };
    orientation: { x: number; y: number; z: number; w: number };
    topic: string;
}

export interface TraveledDistance {
    distance_traveled: number;
    topic: string;
}

export interface RobotPoseWithDistance {
    pose: RobotPose;
    distance_traveled: number;
}