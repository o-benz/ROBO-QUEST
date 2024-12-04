import { BasicCommand } from '@common/interfaces/BasicCommand';

export interface P2PCommand extends BasicCommand {
    launch: boolean;
}