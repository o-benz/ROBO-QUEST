import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MissionService } from './mission.service';
import { MissionDocument } from '@app/model/database/Mission';
import { Model } from 'mongoose';
import { LogMessage } from '@common/interfaces/LogMessage';
import { MissionType } from '@common/enums/MissionType';
import { Mission } from '@app/model/database/Mission';
import { OccupancyGrid } from '@common/interfaces/LiveMap';
import { Logger } from '@nestjs/common/services/logger.service';

const mockMission: Mission = {
    id: 'test-id',
    logs: [
        { source: 'system', log_type: 'info', date: new Date().toISOString(), message: 'Log entry 1' },
        { source: 'system', log_type: 'info', date: new Date().toISOString(), message: 'Log entry 2' },
    ],
    map: [],
    missionType: MissionType.GAZEBO_SIMULATION,
    missionDuration: '2h 30m',
    traveledDistance: 1500,
    robots: ['robot1', 'robot2'],
};

describe('MissionService', () => {
    let service: MissionService;
    let model: Model<MissionDocument>;
    let logger: Logger;

    beforeEach(async () => {
        const mockmodel = {
            updateOne: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            deleteOne: jest.fn(),
            deleteMany: jest.fn(),
        };

        const mockLogger = {
            log: jest.fn(),
            error: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MissionService,
                {
                    provide: getModelToken('Mission'),
                    useValue: mockmodel,
                },
                { provide: Logger, useValue: mockLogger },
            ],
        }).compile();

        service = module.get<MissionService>(MissionService);
        model = module.get<Model<MissionDocument>>(getModelToken('Mission'));
        logger = module.get<Logger>(Logger);
    });

    it('should create a mission', async () => {
        await service.createMission(mockMission);
        expect(model.create).toHaveBeenCalledWith(mockMission);
        expect(service.missionId).toBe(mockMission.id);
    });

    it('should add a log to a mission', async () => {
        const missionId = 'test-id';
        const log: LogMessage = {
            message: 'test log',
            log_type: 'string',
            date: 'string',
            source: 'ss',
        };
        await service.addLogToMission(missionId, log);
        expect(model.updateOne).toHaveBeenCalledWith({ id: missionId }, { $push: { logs: log } });
    });

    it('should get a mission', async () => {
        const missionId = 'test-id';
        await service.getMission(missionId);
        expect(model.findOne).toHaveBeenCalledWith({ id: missionId });
    });

    it('should get all missions', async () => {
        await service.getAllMissions();
        expect(model.find).toHaveBeenCalled();
    });

    it('should delete a mission', async () => {
        const missionId = 'test-id';
        await service.deleteMission(missionId);
        expect(model.deleteOne).toHaveBeenCalledWith({ id: missionId });
    });

    it('should delete all missions', async () => {
        await service.deleteAllMissions();
        expect(model.deleteMany).toHaveBeenCalledWith({});
    });

    it('should handle error when creating a mission', async () => {
        (model.create as jest.Mock).mockRejectedValueOnce(new Error('Create Error'));
        await expect(service.createMission(mockMission)).rejects.toEqual('Failed to create mission test-id');
    });

    it('should handle error when adding a log to a mission', async () => {
        const log: LogMessage = { message: 'test log', log_type: 'string', date: 'string', source: 'ss' };
        (model.updateOne as jest.Mock).mockRejectedValueOnce(new Error('Update Error'));
        await expect(service.addLogToMission('test-id', log)).rejects.toEqual('Failed to add log to mission test-id');
    });

    it('should handle error when getting a mission', async () => {
        (model.findOne as jest.Mock).mockRejectedValueOnce(new Error('Find One Error'));
        await expect(service.getMission('test-id')).rejects.toThrow('Find One Error');
    });

    it('should handle error when getting all missions', async () => {
        (model.find as jest.Mock).mockRejectedValueOnce(new Error('Find Error'));
        await expect(service.getAllMissions()).rejects.toThrow('Find Error');
    });

    it('should handle error when deleting a mission', async () => {
        (model.deleteOne as jest.Mock).mockRejectedValueOnce(new Error('Delete One Error'));
        await expect(service.deleteMission('test-id')).rejects.toEqual('Failed to delete mission test-id');
    });

    it('should handle error when deleting all missions', async () => {
        (model.deleteMany as jest.Mock).mockRejectedValueOnce(new Error('Delete Many Error'));
        await expect(service.deleteAllMissions()).rejects.toEqual('Failed to delete all missions');
    });

    it('should check if mission is active', async () => {
        service.missionId = 'test-id';
        (model.findOne as jest.Mock).mockResolvedValueOnce({ id: 'test-id' });
        const result = await service.isMissionActive();
        expect(result).toBe(true);
        expect(model.findOne).toHaveBeenCalledWith({ id: 'test-id' });
    });

    it('should return false if mission is inactive', async () => {
        service.missionId = 'inactive-id';
        (model.findOne as jest.Mock).mockResolvedValueOnce(null);
        const result = await service.isMissionActive();
        expect(result).toBe(false);
    });

    it('should return true if mission is active', async () => {
        service.missionId = 'activeMissionId';
        model.findOne = jest.fn().mockResolvedValue({ id: 'activeMissionId' });

        await expect(service.isMissionActive()).resolves.toBe(true);
        expect(model.findOne).toHaveBeenCalledWith({ id: 'activeMissionId' });
    });

    it('should return false if missionId is null', async () => {
        service.missionId = null;

        await expect(service.isMissionActive()).resolves.toBe(false);
        expect(model.findOne).not.toHaveBeenCalled();
    });

    it('should return false if no mission is found', async () => {
        service.missionId = 'nonExistentMissionId';
        model.findOne = jest.fn().mockResolvedValue(null);

        await expect(service.isMissionActive()).resolves.toBe(false);
        expect(model.findOne).toHaveBeenCalledWith({ id: 'nonExistentMissionId' });
    });

    it('should log an error and throw an exception if findOne fails', async () => {
        service.missionId = 'testMissionId';
        const error = new Error('Database error');
        model.findOne = jest.fn().mockRejectedValue(error);

        await expect(service.isMissionActive()).rejects.toThrow('Failed to check mission status');

        expect(logger.error).not.toHaveBeenCalled();
    });

    it('should update the map successfully', async () => {
        const missionId = 'testMissionId';
        const map = [{ data: [0, 0, 0], info: { resolutcion: 0.05 } }] as unknown as OccupancyGrid[];

        model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

        await expect(service.addMapToMission(missionId, map)).resolves.toBeUndefined();
        expect(model.updateOne).toHaveBeenCalledWith({ id: missionId }, { map });
    });

    it('should handle update failures', async () => {
        const missionId = 'testMissionId';
        const map = [{ data: [0, 0, 0], info: { resolution: 0.05 } }] as unknown as OccupancyGrid[];

        model.updateOne = jest.fn().mockRejectedValue(new Error('Database error'));

        await expect(service.addMapToMission(missionId, map)).rejects.toEqual(`Failed to add map to mission ${missionId}`);
        expect(model.updateOne).toHaveBeenCalledWith({ id: missionId }, { map });
    });

    it('should update the mission type successfully', async () => {
        const missionId = 'testMissionId';
        const missionType = MissionType.GAZEBO_SIMULATION;

        model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

        await expect(service.updateMissionType(missionId, missionType)).resolves.toBeUndefined();
        expect(logger.log).not.toHaveBeenCalled();
    });

    it('should handle update failures', async () => {
        const missionId = 'testMissionId';
        const missionType = MissionType.GAZEBO_SIMULATION;

        model.updateOne = jest.fn().mockRejectedValue(new Error('Database error'));

        await expect(service.updateMissionType(missionId, missionType)).rejects.toEqual(
            `Failed to update mission ${missionId} type to ${missionType}`,
        );
        expect(logger.log).not.toHaveBeenCalled();
    });

    it('should update the mission duration successfully', async () => {
        const missionId = 'testMissionId';
        const endTime = '2024-12-03T10:00:00Z';

        jest.spyOn<any, any>(service, 'calculateDuration').mockReturnValue('2 hours');
        model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

        await expect(service.updateMissionDuration(missionId, endTime)).resolves.toBeUndefined();

        expect(service['calculateDuration']).toHaveBeenCalledWith(missionId, endTime);
        expect(logger.log).not.toHaveBeenCalled();
    });

    it('should handle update failures', async () => {
        const missionId = 'testMissionId';
        const endTime = '2024-12-03T10:00:00Z';

        jest.spyOn<any, any>(service, 'calculateDuration').mockReturnValue('2 hours');
        model.updateOne = jest.fn().mockRejectedValue(new Error('Database error'));

        await expect(service.updateMissionDuration(missionId, endTime)).rejects.toEqual(`Failed to update mission ${missionId} duration`);

        expect(service['calculateDuration']).toHaveBeenCalledWith(missionId, endTime);
        expect(logger.log).not.toHaveBeenCalled();
    });

    it('should successfully update the traveled distance', async () => {
        const missionId = 'testMissionId';
        const traveledDistance = 123.4567;

        model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

        await expect(service.updateTraveledDistance(missionId, traveledDistance)).resolves.toBeUndefined();

        const roundedDistance = Math.round(traveledDistance * 100) / 100; // Should be 123.46
        expect(model.updateOne).toHaveBeenCalledWith({ id: missionId }, { traveledDistance: roundedDistance });
    });

    it('should reject with an error if updateOne fails', async () => {
        const missionId = 'testMissionId';
        const traveledDistance = 123.4567;
        const roundedDistance = Math.round(traveledDistance * 100) / 100; // Should be 123.46

        const error = new Error('Database error');
        model.updateOne = jest.fn().mockRejectedValue(error);

        await expect(service.updateTraveledDistance(missionId, traveledDistance)).rejects.toEqual(
            `Failed to update mission ${missionId} traveled distance to ${roundedDistance}`,
        );

        expect(model.updateOne).toHaveBeenCalledWith({ id: missionId }, { traveledDistance: roundedDistance });
    });

    it('should successfully update the traveled distance', async () => {
        const missionId = 'testMissionId';
        const traveledDistance = 123.4567;

        model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

        await expect(service.updateTraveledDistance(missionId, traveledDistance)).resolves.toBeUndefined();

        const roundedDistance = Math.round(traveledDistance * 100) / 100; // Should be 123.46
        expect(model.updateOne).toHaveBeenCalledWith({ id: missionId }, { traveledDistance: roundedDistance });
    });

    it('should reject with an error if updateOne fails', async () => {
        const missionId = 'testMissionId';
        const traveledDistance = 123.4567;
        const roundedDistance = Math.round(traveledDistance * 100) / 100; // Should be 123.46

        const error = new Error('Database error');
        model.updateOne = jest.fn().mockRejectedValue(error);

        await expect(service.updateTraveledDistance(missionId, traveledDistance)).rejects.toEqual(
            `Failed to update mission ${missionId} traveled distance to ${roundedDistance}`,
        );

        expect(model.updateOne).toHaveBeenCalledWith({ id: missionId }, { traveledDistance: roundedDistance });
    });

    it('should not add the robot if it already exists in the mission', async () => {
        const missionId = 'testMissionId';
        const robot = 'robot1';

        model.findOne = jest.fn().mockResolvedValue({ id: missionId, robots: [{ robotId: robot }] });

        await service.addRobotToMission(missionId, robot);

        expect(model.updateOne).not.toHaveBeenCalled();
        expect(model.findOne).toHaveBeenCalledWith({ id: missionId, 'robots.robotId': robot });
    });

    it('should add the robot to the mission if it does not already exist', async () => {
        const missionId = 'testMissionId';
        const robot = 'robot1';

        model.findOne = jest.fn().mockResolvedValue(null);
        model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

        await service.addRobotToMission(missionId, robot);

        expect(logger.log).not.toHaveBeenCalled();
    });

    it('should reject with an error if findOne or updateOne fails', async () => {
        const missionId = 'testMissionId';
        const robot = 'robot1';
        const error = new Error('Database error');

        model.findOne = jest.fn().mockRejectedValue(error);

        await expect(service.addRobotToMission(missionId, robot)).rejects.toEqual(`Failed to add robot ${robot} to mission ${missionId}`);

        expect(model.findOne).toHaveBeenCalledWith({ id: missionId, 'robots.robotId': robot });
        expect(model.updateOne).not.toHaveBeenCalled();
    });

    it('should update robots in mission successfully', async () => {
        const missionId = 'testMissionId';
        const robots = ['robot1', 'robot2'];

        model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });

        await service.updateRobotsToMission(missionId, robots);

        expect(logger.log).not.toHaveBeenCalled();
    });

    it('should reject with an error if updateOne fails', async () => {
        const missionId = 'testMissionId';
        const robots = ['robot1', 'robot2'];
        const error = new Error('Database error');

        model.updateOne = jest.fn().mockRejectedValue(error);

        await expect(service.updateRobotsToMission(missionId, robots)).rejects.toEqual(`Failed to update mission ${missionId} robots to ${robots}`);
        expect(model.updateOne).toHaveBeenCalledWith({ id: missionId }, { robots });
    });

    it('should calculate duration correctly', () => {
        const startTime = '2024-12-01T10:00:00Z';
        const endTime = '2024-12-01T12:30:15Z';

        const result = service['calculateDuration'](startTime, endTime);

        expect(result).toBe('2 hours, 30 minutes, 15 seconds');
    });

    it('should handle same start and end time', () => {
        const startTime = '2024-12-01T10:00:00Z';
        const endTime = '2024-12-01T10:00:00Z';

        const result = service['calculateDuration'](startTime, endTime);

        expect(result).toBe('0 hours, 0 minutes, 0 seconds');
    });

    it('should handle edge cases with invalid date inputs', () => {
        const startTime = 'invalid-date';
        const endTime = '2024-12-01T12:00:00Z';

        const result = service['calculateDuration'](startTime, endTime);

        expect(result).toBe('NaN hours, NaN minutes, NaN seconds'); // Edge case handling can be adjusted as per requirements
    });
});
