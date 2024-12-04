import { LogMessage } from '@common/interfaces/LogMessage';
import { OccupancyGrid } from '@common/interfaces/LiveMap';
import { MissionType } from '@common/enums/MissionType';

export interface Mission {
    id: string;
    logs: LogMessage[];
    map: OccupancyGrid[];
    robots: string[];
    missionType: MissionType;
    missionDuration: string;
    traveledDistance: number;
}