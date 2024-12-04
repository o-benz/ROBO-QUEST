import { Injectable, Logger, Inject } from '@nestjs/common';
import { LogMessage } from '@common/interfaces/LogMessage';
import { LogType } from '@common/enums/LogType';
import { MissionService } from '../mission/mission.service';

@Injectable()
export class LogService {
    constructor(
        @Inject('server') public server: any,
        private missionService: MissionService,
        @Inject('Logger') public readonly logger: Logger,
    ) {}

    private buildLogMessage(logType: string, message: string): LogMessage {
        const logMessage: LogMessage = {} as LogMessage;
        logMessage.source = 'Client';
        logMessage.log_type = logType;
        logMessage.date = new Date()
            .toLocaleString('sv-SE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            })
            .replace(':', 'h ')
            .replace(':', 'min ')
            .concat('s');
        logMessage.message = message;
        return logMessage;
    }

    private nativeLog(logType: LogType, message: string): void {
        switch (logType) {
            case LogType.INFO:
                this.logger.log(message);
                break;
            case LogType.WARNING:
                this.logger.warn(message);
                break;
            case LogType.ERROR:
                this.logger.error(message);
                break;
            case LogType.DEBUG:
                this.logger.debug(message);
                break;
            default:
                console.log('UNKNOWN LOG TYPE:', message);
                break;
        }
    }

    async logToClient(logType: LogType, message: string) {
        try {
            const logMessage = this.buildLogMessage(logType, message);
            this.nativeLog(logType, message);
            if (this.server) this.server.emit('log', logMessage);
            if (this.missionService.missionId) await this.missionService.addLogToMission(this.missionService.missionId, logMessage);
        } catch (err) {
            console.log(err);
        }
    }
}