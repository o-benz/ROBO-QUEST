import { RobotCommand } from '@common/enums/RobotCommand';
import { BasicCommand } from '@common/interfaces/BasicCommand';

export interface UpdateControllerCode extends BasicCommand {
    command: RobotCommand.UpdateControllerCode;
    code: string;
    filename: string;
}
