import { RobotCommand } from '@common/enums/RobotCommand';
import { BasicCommand } from '@common/interfaces/BasicCommand';

export interface GeofenceBounds extends BasicCommand {
    command: RobotCommand.SetGeofence;
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
}
