import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QueueService {
    private queue: any[] = [];
    private specialQueue: any[] = [];
    private responseQueue: any[] = [];
    private readonly logger = new Logger(QueueService.name);

    addToQueue(data: any): void {
        this.queue.push(data);
        this.logger.log(`Added data to queue: ${JSON.stringify(data)}. Queue length: ${this.queue.length}`);
    }

    getBatch(size: number): any[] {
        const batch = this.queue.splice(0, size);
        this.logger.log(`Retrieved batch of size ${size}. New queue length: ${this.queue.length}`);
        return batch;
    }

    getQueueSize() {
        return this.queue.length;
    }

    // Special queue

    addToSpecialQueue(data: any): void {
        this.specialQueue.push(data);
        this.logger.log(`Added data to special queue: ${JSON.stringify(data)}. Special queue length: ${this.specialQueue.length}`);
    }

    getSpecialBatch(size: number): any[] {
        const batch = this.specialQueue.splice(0, size);
        this.logger.log(`Retrieved batch of size ${size}. New special queue length: ${this.specialQueue.length}`);
        return batch;
    }

    getSpecialQueueSize() {
        return this.specialQueue.length;
    }

    // Submit response queue

    addToResponseQueue(data: any): void {
        this.responseQueue.push(data);
        this.logger.log(`Added data to response queue: ${JSON.stringify(data)}. Response queue length: ${this.responseQueue.length}`);
    }

    getResponseBatch(size: number): any[] {
        const batch = this.responseQueue.splice(0, size);
        this.logger.log(`Retrieved responses batch of size ${size}. New response queue length: ${this.responseQueue.length}`);
        return batch;
    }

    getResponseQueueSize() {
        return this.responseQueue.length;
    }
}
