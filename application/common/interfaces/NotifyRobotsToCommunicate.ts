import { RobotCommand } from '@common/enums/RobotCommand';
import { BasicCommand } from '@common/interfaces/BasicCommand';

export interface NotifyRobotsToCommunicate extends BasicCommand {
    command: RobotCommand.InitiateP2P;
}
