import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

@Module({
    imports: [PrismaModule],
    providers: [RewardsService],
    controllers: [RewardsController],
    exports: [RewardsService]
})
export class RewardsModule {}
