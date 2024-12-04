import { RobotId } from '@common/enums/RobotId';
export interface IdentifyRobot {
    command: string;
    target: RobotId;
}