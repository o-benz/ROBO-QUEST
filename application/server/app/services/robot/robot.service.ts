import { Inject, Injectable, Logger } from '@nestjs/common';
import { WebSocket } from 'ws';
import { MessageOperation } from '@common/interfaces/MessageOperation';
import { StartMission } from '@common/interfaces/StartMission';
import { EndMission } from '@common/interfaces/EndMission';
import { ReturnToBase } from '@common/interfaces/ReturnToBase';
import { SetGeofence } from '@common/interfaces/SetGeofence';
import { GeofenceBounds } from '@common/interfaces/GeofenceBounds';
import { BasicCommand } from '@common/interfaces/BasicCommand';
import { P2PCommand } from '@common/interfaces/P2PCommand';
import { UpdateControllerCode } from '@common/interfaces/UpdateControllerCode';
import { RobotCommand } from '@common/enums/RobotCommand';
import { Operation } from '@common/enums/Operation';
import { Topic } from '@common/enums/Topic';
import { TopicType } from '@common/enums/TopicType';
import { RobotId } from '@common/enums/RobotId';
import { timeStamp } from 'console';
import { MissionService } from '../mission/mission.service';

@Injectable()
export class RobotService {
    private readonly logger: Logger = new Logger(RobotService.name);
    private _robotIp: string;
    private _robotNumber: RobotId;
    private ws: WebSocket;

    constructor(
        @Inject('robotIp') robotIp: string,
        @Inject('robotNb') robotNb: RobotId,
        private missionService: MissionService,
    ) {
        this._robotIp = robotIp;
        this._robotNumber = robotNb;
    }

    isConnected(): boolean {
        return this.ws && this.ws.readyState == WebSocket.OPEN;
    }

    async connect() {
        return new Promise<void>((resolve, reject) => {
            this.ws = new WebSocket(`ws://${this._robotIp}:${process.env.ROS_BRIDGING_PORT}`);

            this.ws.onopen = () => {
                this.logger.log(`Connection established to robot ${this._robotIp}`);
                resolve();
            };

            this.ws.onerror = (error) => {
                this.logger.error(`WebSocket error: ${error.message}`);
                reject(error);
            };

            this.ws.onclose = () => {
                this.logger.log(`WebSocket connection closed`);
            };
        });
    }

    async subscribeToTopic(topicName: Topic, topicType: TopicType, handleIncomingMessage: (message) => void) {
        try {
            if (this.ws.readyState !== WebSocket.OPEN) {
                await this.connect();
            }
            const subscribeMessage: MessageOperation = {
                op: Operation.subscribe,
                topic: topicName,
                type: topicType,
            };
            this.ws.send(JSON.stringify(subscribeMessage));
            this.logger.log(`Subscription to topic ${topicName} of robot ${this._robotIp}`);
            this.ws.addEventListener('message', (event) => {
                try {
                    const messageData = JSON.parse(event.data.toString());
                    if (messageData.topic === topicName) {
                        handleIncomingMessage(messageData);
                    }
                } catch (error) {
                    this.logger.error(`Error processing message from topic ${topicName}: ${error}`);
                }
            });
        } catch (error) {
            this.logger.error(`Subscription to ${this._robotIp} failed with error: ${error.message}`);
        }
        if (this._robotNumber != RobotId.gazebo) {
            await this.missionService.addRobotToMission(this.missionService.missionId, this._robotIp);
        } else if (topicType == TopicType.pose_with_distance) {
            const robotIdMatch = topicName.match(/^\/([^\/]+)\//);
            if (robotIdMatch) {
                const robotId = robotIdMatch[1];
                await this.missionService.addRobotToMission(this.missionService.missionId, robotId);
            }
        }
    }

    async publishToTopic(topicName: Topic, topicType: TopicType, message: BasicCommand) {
        try {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                await this.connect();
            }
            const publishMessage: MessageOperation = {
                op: Operation.publish,
                topic: topicName,
                type: topicType,
                msg: message,
            };
            this.ws.send(JSON.stringify(publishMessage));
            this.logger.log(`Publish message to topic ${topicName} of robot ${this._robotIp}:`);
        } catch (error) {
            this.logger.error(`Publish to ${this._robotIp} failed with error: ${error.message}`);
        }
    }

    async startMission() {
        await this.publishToTopic(Topic.start_mission, TopicType.start_mission, {
            command: RobotCommand.StartMission,
            mission_details: {
                orientation1: 0.0,
                position1: {
                    x: 0.0,
                    y: 0.0,
                },
                orientation2: 0.0,
                position2: {
                    x: 0.0,
                    y: 0.0,
                },
            },
            timestamp: new Date().toISOString(),
        } as StartMission);
    }

    async stopMission() {
        await this.publishToTopic(Topic.stop_mission, TopicType.stop_mission, {
            command: RobotCommand.EndMission,
            timestamp: new Date().toISOString(),
        } as EndMission);
    }

    async returnToBase() {
        await this.publishToTopic(Topic.return_base, TopicType.return_base, {
            command: RobotCommand.ReturnToBase,
            timestamp: new Date().toISOString(),
        } as ReturnToBase);
    }

    async identify() {
        var topicCommand;
        if (this._robotNumber == RobotId.robot1) {
            topicCommand = Topic.identify_command1;
        } else if (this._robotNumber == RobotId.robot2) {
            topicCommand = Topic.identify_command2;
        }
        await this.publishToTopic(topicCommand, TopicType.identify_robot, {
            command: RobotCommand.IdentifyRobot,
            timestamp: new Date().toISOString(),
        } as BasicCommand);
    }

    async updateRobotCode(newCodeRequestObject: UpdateControllerCode) {
        const topicName =
            this._robotNumber == RobotId.robot1
                ? Topic.update_code_robot1
                : this._robotNumber == RobotId.robot2
                ? Topic.update_code_robot2
                : Topic.update_code_gazebo;
        await this.publishToTopic(topicName, TopicType.update_code, newCodeRequestObject);
    }

    async launch_p2p(launch: boolean) {
        const topicName = this._robotNumber == RobotId.robot1 ? Topic.peer_to_peer1 : Topic.peer_to_peer2;
        await this.publishToTopic(topicName, TopicType.peer_to_peer, {
            command: RobotCommand.P2P,
            launch: launch,
            timestamp: new Date().toISOString(),
        } as P2PCommand);
    }

    async initiateFence(message: SetGeofence) {
        const geofenceMessage: GeofenceBounds = {
            command: message.command,
            timestamp: message.timestamp,
            x_min: message.geofence_coordinates.x_min,
            x_max: message.geofence_coordinates.x_max,
            y_min: message.geofence_coordinates.y_min,
            y_max: message.geofence_coordinates.y_max,
        };
        await this.publishToTopic(Topic.geofence, TopicType.geofence, geofenceMessage);
    }
}
