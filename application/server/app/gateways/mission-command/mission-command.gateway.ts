import { RobotCommand } from '@common/enums/RobotCommand';
import { EndMission } from '@common/interfaces/EndMission';
import { StartMission } from '@common/interfaces/StartMission';
import { IdentifyRobot } from '@common/interfaces/IdentifyRobot';
import { RobotId } from '@common/enums/RobotId';
import { Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SubscriptionServiceService } from '@app/services/subscription-service/subscription-service.service';
import { LogService } from '@app/services/log/log.service';
import { LogType } from '@common/enums/LogType';
import { ClientCommand } from '@common/enums/ClientCommand';
import { MissionService } from '@app/services/mission/mission.service';
import * as fs from 'fs';
import * as path from 'path';
import { ReturnToBase } from '@common/interfaces/ReturnToBase';
import { UpdateControllerCode } from '@common/interfaces/UpdateControllerCode';
import { MissionType } from '@common/enums/MissionType';
import { SetGeofence } from '@common/interfaces/SetGeofence';

@Injectable()
@WebSocketGateway()
export class MissionCommandGateway {
    @WebSocketServer()
    server: Server;
    private logger: LogService;
    private controllingClient: Socket | null = null;
    pathToAllFiles: string = path.resolve(__dirname, '../../../../../../../embedded_ws/src/com_bridge/com_bridge/');

    constructor(
        private subscriptionService: SubscriptionServiceService,
        private missionService: MissionService,
    ) {
        this.logger = new LogService(this.server, this.missionService, new Logger('MissionCommandGateway'));
    }

    async handleDisconnect(client: Socket) {
        if (this.controllingClient === client) {
            await this.logger.logToClient(LogType.INFO, 'Controlling client disconnected, allowing new controller');
            this.controllingClient = null;
        }
    }

    async verifyPermissionToControl(client: Socket): Promise<boolean> {
        if (this.controllingClient === null) {
            this.controllingClient = client;
            this.logger.server = this.server;
            await this.logger.logToClient(LogType.INFO, `Client ${client.id} is now controlling the robots`);
            return true;
        } else if (this.controllingClient !== client) {
            await this.logger.logToClient(LogType.INFO, `Client ${client.id} sent a control command, but another client is already controlling`);
            client.emit('commandError', 'Another client is controlling the robots');
            return false;
        }
        return true;
    }

    private async handleMissionCommand(client: Socket, payload: { target: RobotId[] }, command: 'start' | 'stop') {
        if (!(await this.verifyPermissionToControl(client))) {
            client.emit('commandError', 'The system is already being controlled');
            return;
        }

        const targets = payload.target;
        const commands = {
            start: {
                log: 'Start mission',
                method: 'startMission',
                successMessage: 'Mission started',
            },
            stop: {
                log: 'Stop mission',
                method: 'stopMission',
                successMessage: 'Mission stopped',
            },
        };

        try {
            if (targets.includes(RobotId.robot1) && targets.includes(RobotId.robot2)) {
                await this.logger.logToClient(LogType.INFO, `${commands[command].log} for robots command received from client`);
                if (command === 'start') {
                    await this.missionService.createMission();
                    await this.missionService.updateMissionType(this.missionService.missionId, MissionType.PHYSICAL_ROBOTS);
                }
                if (command === 'stop') {
                    const endTime = new Date().toISOString().slice(0, -5)
                    await this.missionService.updateMissionDuration(this.missionService.missionId, endTime);
                }
                await this.subscriptionService.robot1[commands[command].method]();
                await this.subscriptionService.robot2[commands[command].method]();
                if (command === 'start') await this.subscriptionService.subscribeToTopicRobots(this);
                this.server.emit('missionStatus', `${commands[command].successMessage} for robots`);
            } else if (targets.includes(RobotId.gazebo)) {
                await this.logger.logToClient(LogType.INFO, `${commands[command].log} for simulation command received from client`);
                if (command === 'start') {
                    await this.missionService.createMission();
                    await this.missionService.updateMissionType(this.missionService.missionId, MissionType.GAZEBO_SIMULATION);
                }
                if (command === 'stop') {
                    const endTime = new Date().toISOString().slice(0, -5)
                    await this.missionService.updateMissionDuration(this.missionService.missionId, endTime);
                }
                await this.subscriptionService.gazebo[commands[command].method]();
                if (command === 'start') await this.subscriptionService.subscribeToTopicGazebo(this);
                this.server.emit('missionStatus', `${commands[command].successMessage} for the simulation`);
            } else {
                await this.logger.logToClient(LogType.ERROR, 'Invalid mission command');
                this.server.emit('commandError', `Invalid ${command} mission command`);
            }
        } catch (e) {
            await this.logger.logToClient(LogType.ERROR, `Error in ${command} MissionRobots: ${e}`);
            this.server.emit('commandError', `${e.message} please try again`);
        }
    }

    @SubscribeMessage(RobotCommand.StartMission)
    async startMissionRobots(client: Socket, payload: StartMission) {
        await this.handleMissionCommand(client, payload, 'start');
    }

    @SubscribeMessage(RobotCommand.EndMission)
    async stopMissionFromRobots(client: Socket, payload: EndMission) {
        await this.handleMissionCommand(client, payload, 'stop');
    }

    @SubscribeMessage(RobotCommand.ReturnToBase)
    async returnToBase(client:Socket, payload: ReturnToBase) {
        if (!(await this.verifyPermissionToControl(client))) {
            client.emit('commandError', 'The system is already being controlled');
            return;
        }

        await this.logger.logToClient(LogType.INFO, 'Return home command received from client');

        if (this.subscriptionService.gazebo.isConnected()) await this.subscriptionService.gazebo.returnToBase();
        if (this.subscriptionService.robot1.isConnected()) await this.subscriptionService.robot1.returnToBase();
        if (this.subscriptionService.robot2.isConnected()) await this.subscriptionService.robot2.returnToBase();

    }

    @SubscribeMessage(RobotCommand.IdentifyRobot)
    async identifyRobot(client: Socket, payload: IdentifyRobot) {
        if (!(await this.verifyPermissionToControl(client))) {
            client.emit('commandError', 'The system is already being controlled');
            return;
        }

        try {
            switch (payload.target) {
                case RobotId.robot1:
                    await this.logger.logToClient(LogType.INFO, 'Identify robot 1 command received from client');
                    await this.subscriptionService.robot1.identify();
                    break;
                case RobotId.robot2:
                    await this.logger.logToClient(LogType.INFO, 'Identify robot 2 command received from client');
                    await this.subscriptionService.robot2.identify();
                    this.server.emit('robotIdentification', 'Robot 2 was identified');
                    break;
                default:
                    await this.logger.logToClient(LogType.ERROR, 'Invalid identify robot command');
                    this.server.emit('commandError', 'Invalid identify robot command');
                    return;
            }
        } catch (e) {
            await this.logger.logToClient(LogType.ERROR, 'Error in identifyRobot: ' + e.message);
            this.server.emit('commandError', `${e.message} please try again`);
        }
    }

    @SubscribeMessage(ClientCommand.MissionLogs)
    async getMissionLogs(client: Socket) {
        try {
            await this.logger.logToClient(LogType.INFO, 'Get logs command received from client');
            const logs = await this.missionService.getAllMissions();
            client.emit(ClientCommand.MissionLogs, logs);
        } catch (e) {
            await this.logger.logToClient(LogType.ERROR, 'Error in getLogs: ' + e.message);
        }
    }

    @SubscribeMessage(RobotCommand.UpdateControllerCode)
    async updateControllerCode(client: Socket, payload: UpdateControllerCode) {
        try {
            await this.logger.logToClient(LogType.INFO, 'Mise à jour du code du contrôleur reçue');
            const filePath = path.resolve(this.pathToAllFiles, payload.filename);
            await this.subscriptionService.updateRobotController(payload, filePath);
            client.emit('updateSuccess', 'Mise à jour du code réussie');
        } catch (e) {
            await this.logger.logToClient(LogType.ERROR, 'Erreur de mise à jour du code : ' + e.message);
            client.emit('commandError', `Erreur : ${e.message}`);
        }
    }

    @SubscribeMessage(RobotCommand.GetCodeFile)
    async handleGetCodeFile(client: Socket, filename: string) {   
        const filePath = path.resolve(this.pathToAllFiles, filename);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        client.emit('codeFileContent', fileContent);
    }

    @SubscribeMessage(RobotCommand.InitiateP2P)
    async handleP2P(client: Socket) {
        await this.logger.logToClient(LogType.INFO, 'Commande P2P reçue');
        await this.subscriptionService.robot1.launch_p2p(true);
        await this.subscriptionService.robot2.launch_p2p(true);
    }

    @SubscribeMessage(RobotCommand.SetGeofence)
    async handleGeofence(client: Socket, payload: SetGeofence) {
        await this.logger.logToClient(LogType.INFO, 'Geofence reçue');
        if (this.subscriptionService.gazebo.isConnected()) 
            await this.subscriptionService.gazebo.initiateFence(payload);
        else
            client.emit('commandError', "Le client gazebo n'est pas connecté, imposible de créer une géofence");
    }
}
