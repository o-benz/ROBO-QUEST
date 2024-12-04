import { LogMessage } from '@common/interfaces/LogMessage';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { MissionType } from '@common/enums/MissionType';
import { OccupancyGrid } from '@common/interfaces/LiveMap';

export type MissionDocument = Mission & Document;

@Schema()
export class Mission {
    @ApiProperty()
    @Prop({ required: true })
    id: string;

    @ApiProperty()
    @Prop({ required: true })
    logs: LogMessage[];

    @ApiProperty()
    @Prop({ required: false})
    map: OccupancyGrid[];

    @ApiProperty()
    @Prop({ required: true })
    missionType: MissionType;

    @ApiProperty()
    @Prop({ required: true, type: String })
    missionDuration: string;

    @ApiProperty()
    @Prop({ required: true })
    traveledDistance: number;

    @ApiProperty({ description: 'List of robots participating in the mission' })
    @Prop({ required: true, type: [String] })
    robots: string[];

}

export const MissionSchema = SchemaFactory.createForClass(Mission);
