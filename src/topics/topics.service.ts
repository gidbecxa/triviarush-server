import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, TriviaTopic } from "@prisma/client";

@Injectable()
export class TopicsService {
    constructor(private prisma: PrismaService) { }

    async topic(
        topicWhereUniqueInput: Prisma.TriviaTopicWhereUniqueInput,
    ): Promise<TriviaTopic | null> {
        return this.prisma.triviaTopic.findUnique({
            where: topicWhereUniqueInput,
        });
    }

    async topics(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.TriviaTopicWhereUniqueInput;
        where?: Prisma.TriviaTopicWhereInput;
        orderBy?: Prisma.TriviaTopicOrderByWithRelationInput;
    }): Promise<TriviaTopic[]> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.triviaTopic.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
    }

    async createTopic(data: Prisma.TriviaTopicCreateInput): Promise<TriviaTopic> {
        return this.prisma.triviaTopic.create({
            data,
        });
    }

    async updateTopic(params: {
        where: Prisma.TriviaTopicWhereUniqueInput;
        data: Prisma.TriviaTopicUpdateInput;
    }): Promise<TriviaTopic> {
        const { where, data } = params;
        return this.prisma.triviaTopic.update({
            data,
            where,
        });
    }

    async deleteTopic(where: Prisma.TriviaTopicWhereUniqueInput): Promise<TriviaTopic> {
        return this.prisma.triviaTopic.delete({
            where,
        });
    }
}
