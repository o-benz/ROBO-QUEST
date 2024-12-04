import { RobotCommand } from '@common/enums/RobotCommand';
import { RobotId } from '@common/enums/RobotId';
import { BasicCommand } from '@common/interfaces/BasicCommand';
export interface EndMission extends BasicCommand {
    command: RobotCommand.EndMission;
    target: RobotId[];
}
