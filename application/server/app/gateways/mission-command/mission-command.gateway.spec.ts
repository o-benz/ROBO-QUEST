import { Test, TestingModule } from '@nestjs/testing';
import { MissionCommandGateway } from './mission-command.gateway';
import { SubscriptionServiceService } from '@app/services/subscription-service/subscription-service.service';
import { MissionService } from '@app/services/mission/mission.service';
import { LogService } from '@app/services/log/log.service';
import { Server, Socket } from 'socket.io';
import { RobotId } from '@common/enums/RobotId';
import { LogType } from '@common/enums/LogType';
import { RobotCommand } from '@common/enums/RobotCommand';
import { ClientCommand } from '@common/enums/ClientCommand';
import { StartMission } from '@common/interfaces/StartMission';
import { MissionDetails } from '@common/interfaces/MissionDetails';
import { SetGeofence } from '@common/interfaces/SetGeofence';
import { MissionType } from '@common/enums/MissionType';
import { EndMission } from '@common/interfaces/EndMission';
import { IdentifyRobot } from '@common/interfaces/IdentifyRobot';
import { Mission } from '@app/model/database/Mission';
import { ReturnToBase } from '@common/interfaces/ReturnToBase';
import { UpdateControllerCode } from '@common/interfaces/UpdateControllerCode';
import { GeofenceBounds } from '@common/interfaces/GeofenceBounds';
import * as path from 'path';

describe('MissionCommandGateway', () => {
    let gateway: MissionCommandGateway;
    let subscriptionService: SubscriptionServiceService;
    let missionService: MissionService;
    let logger: LogService;
    let server: { emit: jest.Mock };

    beforeEach(async () => {
        server = { emit: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MissionCommandGateway,
                {
                    provide: SubscriptionServiceService,
                    useValue: {
                        robot1: {
                            startMission: jest.fn(),
                            stopMission: jest.fn(),
                            identify: jest.fn(),
                            returnToBase: jest.fn(),
                            launch_p2p: jest.fn(),
                            isConnected: jest.fn().mockReturnValue(true),
                        },
                        robot2: {
                            startMission: jest.fn(),
                            stopMission: jest.fn(),
                            identify: jest.fn(),
                            returnToBase: jest.fn(),
                            launch_p2p: jest.fn(),
                            isConnected: jest.fn().mockReturnValue(true),
                        },
                        gazebo: {
                            startMission: jest.fn(),
                            stopMission: jest.fn(),
                            returnToBase: jest.fn(),
                            initiateFence: jest.fn(),
                            isConnected: jest.fn().mockReturnValue(true),
                        },
                        subscribeToTopicRobots: jest.fn(),
                        subscribeToTopicGazebo: jest.fn(),
                        updateRobotController: jest.fn(),
                    },
                },
                {
                    provide: MissionService,
                    useValue: {
                        createMission: jest.fn(),
                        updateMissionType: jest.fn(),
                        updateMissionDuration: jest.fn(),
                        getAllMissions: jest.fn(),
                        missionId: 'test-mission-id',
                        addLogToMission: jest.fn(),
                    },
                },
                {
                    provide: LogService,
                    useValue: {
                        logToClient: jest.fn(),
                    },
                },
            ],
        }).compile();

        gateway = module.get<MissionCommandGateway>(MissionCommandGateway);
        subscriptionService = module.get<SubscriptionServiceService>(SubscriptionServiceService);
        missionService = module.get<MissionService>(MissionService);
        logger = module.get<LogService>(LogService);

        gateway.server = server as any;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should get mission logs', async () => {
        const client = { id: 'client1', emit: jest.fn() } as unknown as Socket;
        const missions: Mission[] = [
            { id: '1', logs: [], map: [], missionType: MissionType.GAZEBO_SIMULATION, missionDuration: '1h', traveledDistance: 100, robots: [] },
        ];

        jest.spyOn(missionService, 'getAllMissions').mockResolvedValue(missions);

        await gateway.getMissionLogs(client);

        expect(missionService.getAllMissions).toHaveBeenCalled();
        expect(client.emit).toHaveBeenCalledWith(ClientCommand.MissionLogs, missions);
    });

    it('should start mission for robots', async () => {
        const client = { id: 'client1', emit: jest.fn() } as unknown as Socket;
        const payload: StartMission = {
            target: [RobotId.robot1, RobotId.robot2],
            command: RobotCommand.StartMission,
            mission_details: {
                orientation1: 0,
                position1: { x: 0, y: 0 },
                orientation2: 0,
                position2: { x: 1, y: 1 },
            },
            timestamp: new Date().toISOString(),
        };

        await gateway.startMissionRobots(client, payload);

        expect(subscriptionService.robot1.startMission).toHaveBeenCalled();
        expect(subscriptionService.robot2.startMission).toHaveBeenCalled();
        expect(subscriptionService.subscribeToTopicRobots).toHaveBeenCalledWith(gateway);
        expect(server.emit).toHaveBeenCalledWith('missionStatus', 'Mission started for robots');
    });

    it('should stop mission for robots', async () => {
        const client = { id: 'client1', emit: jest.fn() } as unknown as Socket;
        const payload: EndMission = {
            target: [RobotId.robot1, RobotId.robot2],
            command: RobotCommand.EndMission,
            timestamp: new Date().toISOString(),
        };

        await gateway.stopMissionFromRobots(client, payload);

        expect(subscriptionService.robot1.stopMission).toHaveBeenCalled();
        expect(subscriptionService.robot2.stopMission).toHaveBeenCalled();
        expect(missionService.updateMissionDuration).toHaveBeenCalledWith('test-mission-id', expect.any(String));
        expect(server.emit).toHaveBeenCalledWith('missionStatus', 'Mission stopped for robots');
    });

    it('should identify robot', async () => {
        const client = { id: 'client1', emit: jest.fn() } as unknown as Socket;
        const payload: IdentifyRobot = {
            target: RobotId.robot2,
            command: RobotCommand.IdentifyRobot,
        };

        await gateway.identifyRobot(client, payload);

        expect(subscriptionService.robot2.identify).toHaveBeenCalled();
        expect(server.emit).toHaveBeenCalledWith('robotIdentification', 'Robot 2 was identified');
    });

    it('should handle return to base command', async () => {
        const client = { id: 'client1', emit: jest.fn() } as unknown as Socket;
        const payload: ReturnToBase = {
            command: RobotCommand.ReturnToBase,
            timestamp: new Date().toISOString(),
        };

        await gateway.returnToBase(client, payload);

        expect(subscriptionService.robot1.returnToBase).toHaveBeenCalled();
        expect(subscriptionService.robot2.returnToBase).toHaveBeenCalled();
        expect(subscriptionService.gazebo.returnToBase).toHaveBeenCalled();
    });

    it('should update controller code', async () => {
        const client = { id: 'client1', emit: jest.fn() } as unknown as Socket;
        const payload: UpdateControllerCode = {
            command: RobotCommand.UpdateControllerCode,
            filename: 'controller.js',
            code: 'console.log("New controller code");',
            timestamp: new Date().toISOString(),
        };
        const filePath = path.resolve(gateway.pathToAllFiles, payload.filename);

        await gateway.updateControllerCode(client, payload);

        expect(subscriptionService.updateRobotController).toHaveBeenCalledWith(payload, filePath);
        expect(client.emit).toHaveBeenCalledWith('updateSuccess', 'Mise à jour du code réussie');
    });

    it('should handle geofence creation', async () => {
        const client = { id: 'client1', emit: jest.fn() } as unknown as Socket;
        const payload: SetGeofence = {
            command: RobotCommand.SetGeofence,
            geofence_coordinates: { x_min: 0, y_min: 0, x_max: 1, y_max: 1 },
            timestamp: new Date().toISOString(),
        };

        await gateway.handleGeofence(client, payload);

        expect(subscriptionService.gazebo.initiateFence).toHaveBeenCalledWith(payload);
    });

    it('should handle P2P initiation', async () => {
        const client = { id: 'client1', emit: jest.fn() } as unknown as Socket;

        await gateway.handleP2P(client);

        expect(subscriptionService.robot1.launch_p2p).toHaveBeenCalledWith(true);
        expect(subscriptionService.robot2.launch_p2p).toHaveBeenCalledWith(true);
    });
});
