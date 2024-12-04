import { Test, TestingModule } from '@nestjs/testing';
import { LogService } from './log.service';
import { MissionService } from '../mission/mission.service';
import { LogType } from '@common/enums/LogType';
import { Logger } from '@nestjs/common';

describe('LogService', () => {
    let service: LogService;
    let mockLogger: any;
    let mockMissionService: any;
    let mockServer: any;

    beforeEach(async () => {
        mockLogger = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        };

        mockMissionService = {
            missionId: 'testMissionId',
            addLogToMission: jest.fn().mockResolvedValue(true),
        };

        mockServer = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LogService,
                { provide: 'Logger', useValue: mockLogger },
                { provide: MissionService, useValue: mockMissionService },
                { provide: 'server', useValue: mockServer },
            ],
        }).compile();

        service = module.get<LogService>(LogService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should log debug messages', () => {
        service['nativeLog'](LogType.DEBUG, 'debug message');
        expect(mockLogger.debug).toHaveBeenCalledWith('debug message');
    });

    it('should log info messages', () => {
        service['nativeLog'](LogType.INFO, 'info message');
        expect(mockLogger.log).toHaveBeenCalledWith('info message');
    });

    it('should log warning messages', () => {
        service['nativeLog'](LogType.WARNING, 'warning message');
        expect(mockLogger.warn).toHaveBeenCalledWith('warning message');
    });

    it('should log error messages', () => {
        service['nativeLog'](LogType.ERROR, 'error message');
        expect(mockLogger.error).toHaveBeenCalledWith('error message');
    });

    it('should log unknown log type messages', () => {
        console.log = jest.fn();
        service['nativeLog']('UNKNOWN' as LogType, 'unknown message');
        expect(console.log).toHaveBeenCalledWith('UNKNOWN LOG TYPE:', 'unknown message');
    });

    it('should build log message correctly', () => {
        const logMessage = service['buildLogMessage'](LogType.INFO, 'test message');
        expect(logMessage.source).toBe('Client');
        expect(logMessage.log_type).toBe(LogType.INFO);
        expect(logMessage.message).toBe('test message');
        expect(logMessage.date).toBeDefined();
        expect(new Date(logMessage.date)).toBeInstanceOf(Date);
    });

    it('should log to client and mission service', async () => {
        await service.logToClient(LogType.INFO, 'test message');
        expect(mockLogger.log).toHaveBeenCalledWith('test message');
        expect(mockServer.emit).toHaveBeenCalledWith('log', expect.any(Object));
        expect(mockMissionService.addLogToMission).toHaveBeenCalledWith('testMissionId', expect.any(Object));
    });

    it('should handle errors in logToClient gracefully', async () => {
        mockMissionService.addLogToMission.mockRejectedValueOnce(new Error('test error'));
        console.log = jest.fn();
        await service.logToClient(LogType.INFO, 'test message');
        expect(console.log).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle logToClient without missionId', async () => {
        mockMissionService.missionId = null;
        await service.logToClient(LogType.INFO, 'test message');
        expect(mockLogger.log).toHaveBeenCalledWith('test message');
        expect(mockServer.emit).toHaveBeenCalledWith('log', expect.any(Object));
        expect(mockMissionService.addLogToMission).not.toHaveBeenCalled();
    });
});
