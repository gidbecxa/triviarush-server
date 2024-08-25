import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { UsersModule } from 'src/users/users.module';
import { RoomsModule } from 'src/rooms/rooms.module';
import { QueueModule } from 'src/queue/queue.module';
import { RedisModule } from 'src/redis/redis.module';
import { SpecialModule } from 'src/special/special.module';
import { MessagesModule } from 'src/messages/messages.module';
import { QuestionsModule } from 'src/questions/questions.module';
import { ResponseModule } from 'src/response/response.module';

@Module({
  imports: [
    UsersModule,
    RoomsModule,
    QueueModule,
    RedisModule,
    SpecialModule,
    MessagesModule,
    QuestionsModule,
    ResponseModule
  ],
  providers: [EventsGateway],
})
export class EventsModule {}
