import { RobotCommand } from '@common/enums/RobotCommand';
import { BasicCommand } from '@common/interfaces/BasicCommand';
import { Position } from '@common/types/Position';

export interface UpdateRobot extends BasicCommand {
    command: RobotCommand.UpdateRobot;
    identifier: string;
    status: string;
    position: Position;
}
