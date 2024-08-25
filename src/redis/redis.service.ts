import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
    private readonly client: Redis;

    constructor() {
        this.client = new Redis({
            port: 6379,
            host: 'localhost',
        });
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        const data = JSON.stringify(value);
        if (ttl) {
            await this.client.set(key, data, 'EX', ttl);
        } else {
            await this.client.set(key, data);
        }
    }

    async get<T>(key: string): Promise<T | null> {
        const data = await this.client.get(key);
        if (!data) {
            return null;
        }
        return JSON.parse(data);
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }
}
