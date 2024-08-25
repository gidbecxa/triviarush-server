import { Injectable } from '@nestjs/common';
import { PlayerReward, Prisma, TriviaReward } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RewardsService {
    constructor(private prisma: PrismaService) { }

    // Methods for TriviaReward

    async reward(
        rewardWhereUniqueInput: Prisma.TriviaRewardWhereUniqueInput,
    ): Promise<TriviaReward | null> {
        return this.prisma.triviaReward.findUnique({
            where: rewardWhereUniqueInput,
        });
    }

    async rewards(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.TriviaRewardWhereUniqueInput;
        where?: Prisma.TriviaRewardWhereInput;
        orderBy?: Prisma.TriviaRewardOrderByWithRelationInput;
    }): Promise<TriviaReward[]> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.triviaReward.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy
        });
    }

    async createReward(data: Prisma.TriviaRewardCreateInput): Promise<TriviaReward> {
        return this.prisma.triviaReward.create({
            data,
        });
    }

    async updateReward(params: {
        where: Prisma.TriviaRewardWhereUniqueInput;
        data: Prisma.TriviaRewardUpdateInput;
    }): Promise<TriviaReward> {
        const { where, data } = params;
        return this.prisma.triviaReward.update({
            data,
            where,
        });
    }

    async deleteReward(where: Prisma.TriviaRewardWhereUniqueInput): Promise<TriviaReward> {
        return this.prisma.triviaReward.delete({
            where,
        });
    }

    /**
     * Methods for player rewards
     */

    async createPlayerReward(data: Prisma.PlayerRewardCreateInput): Promise<PlayerReward> {
        return this.prisma.playerReward.create({
            data,
        });
    }

    // Get a single player reward
    async playerReward(id: number): Promise<PlayerReward | null> {
        return this.prisma.playerReward.findUnique({
            where: { id },
        });
    }

    // Get all player rewards for a player
    async playerRewards(params: {
        userId: number;
        skip?: number;
        take?: number;
        cursor?: Prisma.PlayerRewardWhereUniqueInput;
        orderBy?: Prisma.PlayerRewardOrderByWithRelationInput;
    }): Promise<PlayerReward[]> {
        const { skip, take, cursor, orderBy, userId } = params;
        return this.prisma.playerReward.findMany({
            skip,
            take,
            cursor,
            where: { userId },
            orderBy
        });
    }

    // Claim player reward
    async claimPlayerReward(id: number): Promise<PlayerReward> {
        return this.prisma.playerReward.update({
            where: { id },
            data: { isClaimed: true },
        })
    }
}
