import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TriviaSpecial, Prisma, TriviaReward } from '@prisma/client';

@Injectable()
export class SpecialService {
    constructor(private prisma: PrismaService) { }

    async specialTrivia(
        specialTriviaWhereUniqueInput: Prisma.TriviaSpecialWhereUniqueInput,
    ): Promise<TriviaSpecial | null> {
        return this.prisma.triviaSpecial.findUnique({
            where: specialTriviaWhereUniqueInput,
            include: {
                reward: true,
            },
        });
    }

    async specialTrivias(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.TriviaSpecialWhereUniqueInput;
        where?: Prisma.TriviaSpecialWhereInput;
        orderBy?: Prisma.TriviaSpecialOrderByWithRelationInput;
    }): Promise<TriviaSpecial[]> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.triviaSpecial.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: {
                reward: true,
            },
        });
    }

    async createSpecialTrivia(data: Prisma.TriviaSpecialCreateInput): Promise<TriviaSpecial> {
        return this.prisma.triviaSpecial.create({
            data,
        });
    }

    async updateSpecialTrivia(params: {
        where: Prisma.TriviaSpecialWhereUniqueInput;
        data: Prisma.TriviaSpecialUpdateInput;
    }): Promise<TriviaSpecial> {
        const { where, data } = params;
        return this.prisma.triviaSpecial.update({
            data,
            where,
        });
    }

    async deleteSpecialTrivia(where: Prisma.TriviaSpecialWhereUniqueInput): Promise<TriviaSpecial> {
        return this.prisma.triviaSpecial.delete({
            where,
        });
    }
}
