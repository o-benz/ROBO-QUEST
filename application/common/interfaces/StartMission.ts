import { RobotCommand } from '@common/enums/RobotCommand';
import { BasicCommand } from '@common/interfaces/BasicCommand';
import { RobotId } from '@common/enums/RobotId';
import { MissionDetails } from '@common/interfaces/MissionDetails';

export interface StartMission extends BasicCommand {
    command: RobotCommand.StartMission;
    target: RobotId[];
    mission_details: MissionDetails;
}
