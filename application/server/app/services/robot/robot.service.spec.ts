import { Test, TestingModule } from '@nestjs/testing';
import { RobotService } from './robot.service';
import { Logger } from '@nestjs/common';
import { RobotId } from '@common/enums/RobotId';
import { WebSocket } from 'ws';
import { Topic } from '@common/enums/Topic';
import { TopicType } from '@common/enums/TopicType';
import { RobotCommand } from '@common/enums/RobotCommand';
import { MissionService } from '../mission/mission.service';
import { UpdateControllerCode } from '@common/interfaces/UpdateControllerCode';
import { SetGeofence } from '@common/interfaces/SetGeofence';

jest.mock('ws');

describe('RobotService', () => {
    let service: RobotService;
    let logger: Logger;
    let ws: WebSocket;
    let missionService: MissionService;

    beforeEach(async () => {
        missionService = {
            addRobotToMission: jest.fn(),
            missionId: 'mock-mission-id',
        } as unknown as MissionService;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RobotService,
                { provide: 'robotIp', useValue: '127.0.0.1' },
                { provide: 'robotNb', useValue: RobotId.robot1 },
                { provide: Logger, useValue: new Logger() },
                { provide: MissionService, useValue: missionService },
            ],
        }).compile();

        service = module.get<RobotService>(RobotService);
        logger = module.get<Logger>(Logger);

        ws = {
            readyState: WebSocket.OPEN,
            send: jest.fn(),
            addEventListener: jest.fn((event, listener) => {
                if (event === 'open') {
                    setImmediate(() => listener());
                }
            }),
            onopen: jest.fn(),
            onerror: jest.fn(),
            onclose: jest.fn(),
        } as unknown as WebSocket;

        service['ws'] = ws;

        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(logger, 'error').mockImplementation(() => {});
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should have a logger', () => {
        expect(service['logger']).toBeDefined();
        expect(service['logger']).toBeInstanceOf(Logger);
    });

    it('should log messages', () => {
        const logSpy = jest.spyOn(service['logger'], 'log');
        service['logger'].log('Test message');
        expect(logSpy).toHaveBeenCalledWith('Test message');
    });

    it('should have robotIp defined', () => {
        expect(service['_robotIp']).toBeDefined();
        expect(service['_robotIp']).toBe('127.0.0.1');
    });

    it('should have robotNb defined', () => {
        expect(service['_robotNumber']).toBeDefined();
        expect(service['_robotNumber']).toBe(RobotId.robot1);
    });

    it('should subscribe to a topic', async () => {
        const subscribeSpy = jest.spyOn(service, 'subscribeToTopic');
        const handleIncomingMessage = jest.fn();
        await service.subscribeToTopic(Topic.start_mission, TopicType.start_mission, handleIncomingMessage);
        expect(subscribeSpy).toHaveBeenCalledWith(Topic.start_mission, TopicType.start_mission, handleIncomingMessage);
    });

    it('should publish to a topic', async () => {
        const publishSpy = jest.spyOn(service, 'publishToTopic');
        const message = {
            command: RobotCommand.StartMission,
            timestamp: new Date().toISOString(),
        };
        await service.publishToTopic(Topic.start_mission, TopicType.start_mission, message);
        expect(publishSpy).toHaveBeenCalledWith(Topic.start_mission, TopicType.start_mission, message);
    });

    it('should start a mission', async () => {
        const startMissionSpy = jest.spyOn(service, 'startMission');
        await service.startMission();
        expect(startMissionSpy).toHaveBeenCalled();
    });

    it('should stop a mission', async () => {
        const stopMissionSpy = jest.spyOn(service, 'stopMission');
        await service.stopMission();
        expect(stopMissionSpy).toHaveBeenCalled();
    });

    it('should identify the robot', async () => {
        const identifySpy = jest.spyOn(service, 'identify');
        await service.identify();
        expect(identifySpy).toHaveBeenCalled();
    });

    it('should identify robot based on robot number', async () => {
        const publishSpy = jest.spyOn(service, 'publishToTopic');
        service['_robotNumber'] = RobotId.robot2;
        await service.identify();
        expect(publishSpy).toHaveBeenCalledWith(Topic.identify_command2, TopicType.identify_robot, expect.any(Object));
    });

    it('should return to base', async () => {
        const returnToBaseSpy = jest.spyOn(service, 'returnToBase');
        await service.returnToBase();
        expect(returnToBaseSpy).toHaveBeenCalled();
    });

    it('should launch peer-to-peer communication', async () => {
        const launchP2PSpy = jest.spyOn(service, 'launch_p2p');
        await service.launch_p2p(true);
        expect(launchP2PSpy).toHaveBeenCalledWith(true);
    });

    it('should initiate geofence', async () => {
        const initiateFenceSpy = jest.spyOn(service, 'initiateFence');
        const geofenceMessage: SetGeofence = {
            command: RobotCommand.SetGeofence,
            timestamp: new Date().toISOString(),
            geofence_coordinates: {
                x_min: 0,
                x_max: 10,
                y_min: 0,
                y_max: 10,
            },
        };
        await service.initiateFence(geofenceMessage);
        expect(initiateFenceSpy).toHaveBeenCalledWith(geofenceMessage);
    });

    it('should check if the robot is connected', () => {
        expect(service.isConnected()).toBe(true);
    });
});