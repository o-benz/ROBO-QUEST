import { Injectable } from '@nestjs/common';
import { RobotStatus } from '@common/interfaces/RobotStatus';
import { LogMessage } from '@common/interfaces/LogMessage';
import { RobotService } from '../robot/robot.service';
import { Topic } from '@common/enums/Topic';
import { TopicType } from '@common/enums/TopicType';
import { RobotId } from '@common/enums/RobotId';
import { MissionCommandGateway } from '@app/gateways/mission-command/mission-command.gateway';
import { MissionService } from '../mission/mission.service';
import { OccupancyGrid } from '@common/interfaces/LiveMap';
import { RobotPose, TraveledDistance ,RobotPoseWithDistance } from '@common/interfaces/RobotPoseWithDistance';
import * as fs from 'fs';
import { UpdateControllerCode } from '@common/interfaces/UpdateControllerCode';

@Injectable()
export class SubscriptionServiceService {
    public robot1: RobotService;
    public robot2: RobotService;
    public gazebo: RobotService;
    server: any;
    private totalTraveledDistance: number;
    private lastKnownDistances: { [key: string]: number } = {};
    private oldTraveledDistance: number;

    constructor(private missionService: MissionService) {
        this.robot1 = new RobotService(process.env.ROBOT1_IP, RobotId.robot1, missionService);
        this.robot2 = new RobotService(process.env.ROBOT2_IP, RobotId.robot2, missionService);
        this.gazebo = new RobotService(process.env.GAZEBO_IP, RobotId.gazebo, missionService);
    }

    async subscribeToTopicRobot1(gateway: MissionCommandGateway) {
        await this.robot1.subscribeToTopic(Topic.mission_status1, TopicType.mission_status, this.missionStatusCallback.bind(gateway));
        await this.robot1.subscribeToTopic(Topic.log_robot1, TopicType.log_message, this.logCallback.bind(gateway));
        await this.robot1.subscribeToTopic(Topic.physical_robot_map, TopicType.map, this.mapCallback.bind(gateway));
        await this.robot1.subscribeToTopic(Topic.robot1_pose_with_distance, TopicType.pose_with_distance, this.robotPoseWithDistanceCallback.bind(gateway));
    }
    async subscribeToTopicRobot2(gateway: MissionCommandGateway) {
        await this.robot2.subscribeToTopic(Topic.mission_status2, TopicType.mission_status, this.missionStatusCallback.bind(gateway));
        await this.robot2.subscribeToTopic(Topic.log_robot2, TopicType.log_message, this.logCallback.bind(gateway));
        await this.robot2.subscribeToTopic(Topic.robot2_pose_with_distance, TopicType.pose_with_distance, this.robotPoseWithDistanceCallback.bind(gateway));
    }
    async subscribeToTopicGazebo(gateway: MissionCommandGateway) {
        await this.gazebo.subscribeToTopic(Topic.mission_status1, TopicType.mission_status, this.missionStatusCallback.bind(gateway));
        await this.gazebo.subscribeToTopic(Topic.mission_status2, TopicType.mission_status, this.missionStatusCallback.bind(gateway));
        await this.gazebo.subscribeToTopic(Topic.log_gazebo, TopicType.log_message, this.logCallback.bind(gateway));
        await this.gazebo.subscribeToTopic(Topic.map, TopicType.map, this.mapCallback.bind(gateway));
        await this.gazebo.subscribeToTopic(Topic.gazebo1_pose_with_distance, TopicType.pose_with_distance, this.robotPoseWithDistanceCallback.bind(gateway));
        await this.gazebo.subscribeToTopic(Topic.gazebo2_pose_with_distance, TopicType.pose_with_distance, this.robotPoseWithDistanceCallback.bind(gateway));
    }

    async subscribeToTopicRobots(gateway: MissionCommandGateway) {
        await this.subscribeToTopicRobot1(gateway);
        await this.subscribeToTopicRobot2(gateway);
    }

    async missionStatusCallback(message) {
        const robotStatus: RobotStatus = message.msg;
        this.server.emit('robotStatus', robotStatus);
    }

    async logCallback(message) {
        const logMessage: LogMessage = message.msg;
        this.server.emit('log', logMessage);
        await this.missionService.addLogToMission(this.missionService.missionId, logMessage);
    }

    async mapCallback(message) {
        const liveMap: OccupancyGrid = message.msg;
        this.server.emit('liveMap', liveMap);
        if (this.missionService.missionId) await this.missionService.addMapToMission(this.missionService.missionId, [liveMap]);
    }

    async robotPoseWithDistanceCallback(message) {
        const robotPoseWithDistance: RobotPoseWithDistance = message.msg;

        const robotPose: RobotPose = {
            position: robotPoseWithDistance.pose.position,
            orientation: robotPoseWithDistance.pose.orientation,
            topic: message.topic
        };

        const distanceTraveled: TraveledDistance = {
            distance_traveled: robotPoseWithDistance.distance_traveled,
            topic: message.topic
        };

        if (!this.lastKnownDistances) {
            this.lastKnownDistances = {};
            this.oldTraveledDistance = 0;
        }

        if (!this.lastKnownDistances.hasOwnProperty(distanceTraveled.topic)) {
            this.lastKnownDistances[distanceTraveled.topic] = 0;
        }

        this.lastKnownDistances[distanceTraveled.topic] = distanceTraveled.distance_traveled;
        this.totalTraveledDistance = Object.values(this.lastKnownDistances).reduce((acc, distance) => acc + distance, 0);

        this.server.emit('robotPose', robotPose);
        this.server.emit('distanceTraveled', distanceTraveled);
        this.server.emit('robotPoseWithDistance', robotPoseWithDistance);

        if (this.missionService.missionId && this.totalTraveledDistance && this.totalTraveledDistance !== this.oldTraveledDistance) {
            await this.missionService.updateTraveledDistance(this.missionService.missionId, this.totalTraveledDistance);
            this.oldTraveledDistance = this.totalTraveledDistance;
        }
    }

    isAnyRobotConnected(): boolean {
        return this.robot1.isConnected() || this.robot2.isConnected() || this.gazebo.isConnected();
    }

    async updateRobotController(payload: UpdateControllerCode, filePath: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!this.isAnyRobotConnected()) {
                reject({ message: 'No robot connected' });
            } else {
                if (this.robot1.isConnected()) await this.robot1.updateRobotCode(payload);
                if (this.robot2.isConnected()) await this.robot2.updateRobotCode(payload);
                if (this.gazebo.isConnected()) await this.gazebo.updateRobotCode(payload);
                await fs.writeFile(filePath, payload.code, 'utf-8', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    }
}
