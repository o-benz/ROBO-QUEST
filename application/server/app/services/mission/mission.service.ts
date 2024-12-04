import { Mission, MissionDocument } from '@app/model/database/Mission';
import { OccupancyGrid } from '@common/interfaces/LiveMap';
import { LogMessage } from '@common/interfaces/LogMessage';
import { MissionType } from '@common/enums/MissionType';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MissionService {
    constructor(@InjectModel(Mission.name) public missionModel: Model<MissionDocument>) {}
    private readonly logger = new Logger(MissionService.name);
    public missionId = '';
    async createMission(
        mission: Mission = {
            id: new Date().toISOString().slice(0, -5),
            logs: [],
            missionType: MissionType.UNKNOWN,
            missionDuration: " ",
            traveledDistance: 0.0,
            robots: [],
        } as Mission,
    ): Promise<void> {
        try {
            this.logger.log(`Creating mission ${mission.id}`);
            await this.missionModel.create(mission);
            this.missionId = mission.id;
        } catch (err) {
            return Promise.reject(`Failed to create mission ${mission.id}`);
        }
    }
    async addLogToMission(missionId: string, log: LogMessage): Promise<void> {
        try {
            await this.missionModel.updateOne({ id: missionId }, { $push: { logs: log } });
        } catch (err) {
            return Promise.reject(`Failed to add log to mission ${missionId}`);
        }
    }
    async getMission(missionId: string): Promise<Mission | null> {
        try {
            this.logger.log(`Getting mission ${missionId}`);
            return this.missionModel.findOne({ id: missionId });
        } catch (err) {
            return Promise.reject(`Failed to get mission ${missionId}`);
        }
    }
    async getAllMissions(): Promise<Mission[]> {
        try {
            this.logger.log(`Getting all missions`);
            return this.missionModel.find();
        } catch (err) {
            return Promise.reject(`Failed to get all missions`);
        }
    }
    async deleteMission(missionId: string): Promise<void> {
        try {
            this.logger.log(`Deleting mission ${missionId}`);
            await this.missionModel.deleteOne({ id: missionId });
        } catch (err) {
            return Promise.reject(`Failed to delete mission ${missionId}`);
        }
    }
    async deleteAllMissions(): Promise<void> {
        try {
            this.logger.log(`Deleting all missions`);
            await this.missionModel.deleteMany({});
        } catch (err) {
            return Promise.reject(`Failed to delete all missions`);
        }
    }
    async isMissionActive(): Promise<boolean> {
        try {
            if (this.missionId) {
                const mission = await this.missionModel.findOne({ id: this.missionId });
                return !!mission;
            }
            return false;
        } catch (err) {
            this.logger.error('Failed to check mission status', err);
            throw new Error('Failed to check mission status');
        }
    }

    async addMapToMission(missionId: string, map: OccupancyGrid[]): Promise<void> {
        try {
            await this.missionModel.updateOne({ id: missionId }, { map });
        } catch (err) {
            return Promise.reject(`Failed to add map to mission ${missionId}`);
        }
    }

    async updateMissionType(missionId: string, missionType: MissionType): Promise<void> {
        try {
            this.logger.log(`Updating mission ${missionId} type to ${missionType}`);
            await this.missionModel.updateOne({ id: missionId }, { missionType });
        } catch (err) {
            return Promise.reject(`Failed to update mission ${missionId} type to ${missionType}`);
        }
    }

    async updateMissionDuration(missionId: string, endTime: string): Promise<void> {
        try {
            const missionDuration = this.calculateDuration(missionId, endTime);
            this.logger.log(`Updating mission ${missionId} duration to ${missionDuration}`);
            await this.missionModel.updateOne({ id: missionId }, { missionDuration });
        } catch (err) {
            return Promise.reject(`Failed to update mission ${missionId} duration`);
        }
    }

    async updateTraveledDistance(missionId: string, traveledDistance: number): Promise<void> {
        const roundedDistance = Math.round(traveledDistance * 100) / 100;
        try {
            await this.missionModel.updateOne({ id: missionId }, { traveledDistance: roundedDistance });
        } catch (err) {
            return Promise.reject(`Failed to update mission ${missionId} traveled distance to ${roundedDistance}`);
        }
    }

    async addRobotToMission(missionId: string, robot: string): Promise<void> {
        try {
            const mission = await this.missionModel.findOne({ id: missionId, 'robots.robotId': robot });
            if (!mission) {
                this.logger.log(`Adding robot ${robot} to mission ${missionId}`);
                await this.missionModel.updateOne({ id: missionId }, { $push: { robots: robot } });
            }
        } catch (err) {
            return Promise.reject(`Failed to add robot ${robot} to mission ${missionId}`);
        }
    }

    async updateRobotsToMission(missionId: string, robots: string[]): Promise<void> {
        try {
            this.logger.log(`Updating mission ${missionId} robots to ${robots}`);
            await this.missionModel.updateOne({ id: missionId }, { robots });
        } catch (err) {
            return Promise.reject(`Failed to update mission ${missionId} robots to ${robots}`);
        }
    }

    private calculateDuration(startTime: string, endTime: string): string {
        const dt1 = new Date(startTime);
        const dt2 = new Date(endTime);

        const durationMs = dt2.getTime() - dt1.getTime();

        const seconds = Math.floor((durationMs / 1000) % 60);
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const hours = Math.floor(durationMs / (1000 * 60 * 60));

        return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
    }
}
