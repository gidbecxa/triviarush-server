import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TopicsService } from './topics/topics.service';
import { TopicsController } from './topics/topics.controller';
import { TopicsModule } from './topics/topics.module';
import { EventsGateway } from './events/events.gateway';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { RoomsService } from './rooms/rooms.service';
import { RoomsModule } from './rooms/rooms.module';
import { QueueService } from './queue/queue.service';
import { QueueModule } from './queue/queue.module';
import { RedisService } from './redis/redis.service';
import { RedisModule } from './redis/redis.module';
import { SpecialService } from './special/special.service';
import { SpecialController } from './special/special.controller';
import { RewardsService } from './rewards/rewards.service';
import { SpecialModule } from './special/special.module';
import { RewardsController } from './rewards/rewards.controller';
import { RewardsModule } from './rewards/rewards.module';
import { MessagesModule } from './messages/messages.module';
import { MessagesService } from './messages/messages.service';
import { QuestionsService } from './questions/questions.service';
import { QuestionsModule } from './questions/questions.module';
import { ResponseService } from './response/response.service';
import { ResponseModule } from './response/response.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    TopicsModule,
    EventsModule,
    AuthModule,
    RoomsModule,
    QueueModule,
    RedisModule,
    SpecialModule,
    RewardsModule,
    MessagesModule,
    QuestionsModule,
    ResponseModule
  ],
  controllers: [AppController, UsersController, TopicsController, SpecialController, RewardsController],
  providers: [
    AppService,
    PrismaService,
    UsersService,
    TopicsService,
    EventsGateway,
    RoomsService,
    QueueService,
    RedisService,
    SpecialService,
    RewardsService,
    MessagesService,
    QuestionsService,
    ResponseService
  ],
})
export class AppModule {}
