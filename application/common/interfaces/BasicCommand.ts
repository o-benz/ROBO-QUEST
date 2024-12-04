import { RobotCommand } from '@common/enums/RobotCommand';
export interface BasicCommand {
    command: RobotCommand;
    timestamp: string;
  }