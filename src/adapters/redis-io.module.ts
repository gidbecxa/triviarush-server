import { Module } from '@nestjs/common';
import { RedisIoAdapter } from './redis-io.adapter';

@Module({
  providers: [RedisIoAdapter],
})
export class RedisIoModule {}
