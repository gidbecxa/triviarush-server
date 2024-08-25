import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient, RedisClientType } from "redis";

export class RedisIoAdapter extends IoAdapter {
    private adapterConstructor: ReturnType<typeof createAdapter>;
    private pubClient: RedisClientType;
    private subClient: RedisClientType;

    async connectToRedis(): Promise<void> {
        this.pubClient = createClient({ url: "redis://localhost:6379" });
        this.subClient = this.pubClient.duplicate();

        this.pubClient.on('error', (err: any) => {
            console.error('Redis PubClient Error:', err);
        });

        this.subClient.on('error', (err) => {
            console.error('Redis SubClient Error:', err);
        });

        await Promise.all([this.pubClient.connect(), this.subClient.connect()]);

        console.log('Connected to Redis');

        this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
    }

    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        return server;
    }

    getRedisClient() {
        return this.pubClient;
    }
}