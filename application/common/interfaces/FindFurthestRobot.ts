import { RobotCommand } from '@common/enums/RobotCommand';
import { BasicCommand } from '@common/interfaces/BasicCommand';
import { Position } from '@common/types/Position';
export interface FindFurthestRobot extends BasicCommand {
    command: RobotCommand.FindFurthestRobot;
    relative_point: Position
    timestamp: string;
}
