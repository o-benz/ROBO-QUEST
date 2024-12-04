import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MissionCommandGateway } from '@app/gateways/mission-command/mission-command.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionServiceService } from './services/subscription-service/subscription-service.service';
import { Mission, MissionSchema } from './model/database/Mission';
import { MissionService } from './services/mission/mission.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: process.env.DATABASE_CONNECTION_STRING.replace('${BD_NAME}', process.env.BD_NAME),
            }),
        }),
        MongooseModule.forFeature([{ name: Mission.name, schema: MissionSchema }]),
    ],
    providers: [MissionCommandGateway, Logger, SubscriptionServiceService, MissionService],
})
export class AppModule {}
