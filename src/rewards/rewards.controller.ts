import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { TriviaReward, Prisma, PlayerReward } from '@prisma/client';
import { skip } from 'node:test';

@Controller('rewards')
export class RewardsController {
    constructor(private readonly rewardsService: RewardsService) { }

    @Post('create')
    async createReward(
        @Body() data: Prisma.TriviaRewardCreateInput,
    ): Promise<TriviaReward> {
        return this.rewardsService.createReward(data);
    }

    // Create player reward
    @Post('player/create')
    async createPlayerReward(
        @Body() data: Prisma.PlayerRewardCreateInput,
    ): Promise<PlayerReward> {
        return this.rewardsService.createPlayerReward(data);
    }

    @Get()
    async getAllRewards(
        @Query('skip') skip?: number,
        @Query('take') take?: number,
        @Query('cursor') cursor?: Prisma.TriviaRewardWhereUniqueInput,
        @Query('where') where?: Prisma.TriviaRewardWhereInput,
        @Query('orderBy') orderBy?: Prisma.TriviaRewardOrderByWithRelationInput,
    ): Promise<TriviaReward[]> {
        console.log('Fetching rewards...');
        return this.rewardsService.rewards({
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined,
            cursor,
            where,
            orderBy: orderBy ? orderBy : { id: 'desc' },
        });
    }

    @Get('/reward')
    async getRewardById(
        @Query('id') id: string,
    ): Promise<TriviaReward> {
        return this.rewardsService.reward({ id: Number(id) });
    }

    /* Get player's rewards */
    @Get('/player/reward')
    async getPlayerRewardById(
        @Query('id') id: number,
    ): Promise<PlayerReward> {
        return this.rewardsService.playerReward(id);
    }

    @Get('/player/rewards')
    async getPlayerRewards(
        @Query('userId') userId: number,
        @Query('skip') skip?: number,
        @Query('take') take?: number,
        @Query('cursor') cursor?: Prisma.PlayerRewardWhereUniqueInput,
        @Query('where') where?: Prisma.PlayerRewardWhereInput,
        @Query('orderBy') orderBy?: Prisma.PlayerRewardOrderByWithRelationInput,
    ): Promise<PlayerReward[]> {
        return this.rewardsService.playerRewards({
            userId,
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined,
            cursor,
            orderBy: orderBy ? orderBy : { id: 'desc' },
        });
    }

    @Patch('/update/:id')
    async updateReward(
        @Param('id') id: string,
        @Body() data: Prisma.TriviaRewardUpdateInput,
    ): Promise<TriviaReward> {
        return this.rewardsService.updateReward({
            where: { id: Number(id) },
            data,
        });
    }

    @Delete('/delete/:id')
    async deleteReward(
        @Param('id') id: string,
    ): Promise<TriviaReward> {
        return this.rewardsService.deleteReward({ id: Number(id) });
    }
}
