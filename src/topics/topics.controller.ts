import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { Prisma, TriviaTopic } from '@prisma/client';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post('new-topic')
  async createTopic(
    @Body() data: Prisma.TriviaTopicCreateInput,
  ): Promise<TriviaTopic> {
    console.log('Creating new topic...');
    return this.topicsService.createTopic(data);
  }

  @Get()
  async getAllTopics(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('cursor') cursor?: Prisma.TriviaTopicWhereUniqueInput,
    @Query('where') where?: Prisma.TriviaTopicWhereInput,
    @Query('orderBy') orderBy?: Prisma.TriviaTopicOrderByWithRelationInput,
  ): Promise<TriviaTopic[]> {
    console.log('Fetching topics...');
    return this.topicsService.topics({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      cursor: cursor ? cursor : undefined,
      where: where ? where : undefined,
      orderBy: orderBy ? orderBy : { id: 'desc' },
    });
  }

  @Get('topic/:id')
  async getTopicById(@Param('id') id: string): Promise<TriviaTopic> {
    console.log('Fetching topic by id...');
    return this.topicsService.topic({ id: Number(id) });
  }

  @Put('topic/:id')
  async updateTopic(
    @Param('id') id: string,
    @Body() data: Prisma.TriviaTopicUpdateInput,
  ): Promise<TriviaTopic> {
    console.log('Updating topic info...');
    return this.topicsService.updateTopic({ where: { id: Number(id) }, data });
  }

  @Delete('topic/:id')
  async deleteTopic(@Param('id') id: string): Promise<TriviaTopic> {
    console.log('Deleting topic...');
    return this.topicsService.deleteTopic({ id: Number(id) });
  }
}
