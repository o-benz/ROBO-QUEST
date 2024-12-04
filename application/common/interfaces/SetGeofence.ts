import { RobotCommand } from '@common/enums/RobotCommand';
import { BasicCommand } from '@common/interfaces/BasicCommand';
import { GeofenceCoord } from '@common/types/GeofenceCoord';

export interface SetGeofence extends BasicCommand {
    command: RobotCommand.SetGeofence;
    geofence_coordinates: GeofenceCoord;
}
