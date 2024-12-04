import { RobotCommand } from '@common/enums/RobotCommand';
import { BasicCommand } from '@common/interfaces/BasicCommand';

export interface ReturnToBase extends BasicCommand {
    command: RobotCommand.ReturnToBase;
}
