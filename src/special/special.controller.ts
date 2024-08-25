import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TriviaSpecial, Prisma } from '@prisma/client';
import { SpecialService } from './special.service';

@Controller('special')
export class SpecialController {
  constructor(private specialService: SpecialService) {}

  @Get()
  async getAllSpecialTrivias(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('cursor') cursor?: Prisma.TriviaSpecialWhereUniqueInput,
    @Query('where') where?: Prisma.TriviaSpecialWhereInput,
    @Query('orderBy') orderBy?: Prisma.TriviaSpecialOrderByWithRelationInput,
  ): Promise<TriviaSpecial[]> {
    console.log('Fetching special trivias...');
    return this.specialService.specialTrivias({
      skip: Number(skip) || undefined,
      take: Number(take) || undefined,
      cursor: cursor,
      where: where,
      orderBy: orderBy ? orderBy : { createdAt: 'desc' },
    });
  }

  @Get('/:id')
  async getSpecialTrivia(@Param('id') id: string): Promise<TriviaSpecial> {
    console.log('Fetching special trivia:', id);
    return this.specialService.specialTrivia({ id: Number(id) });
  }

  @Post('new')
  async createSpecialTrivia(
    @Body() data: Prisma.TriviaSpecialCreateInput,
  ): Promise<TriviaSpecial> {
    console.log('Creating special trivia:', data);
    return this.specialService.createSpecialTrivia(data);
  }

  @Patch('update/:id')
  async updateSpecialTrivia(
    @Param('id') id: string,
    @Body() data: Prisma.TriviaSpecialUpdateInput,
  ): Promise<TriviaSpecial> {
    console.log('Updating special trivia:', id);
    return this.specialService.updateSpecialTrivia({
      where: { id: Number(id) },
      data,
    });
  }

  @Delete('delete/:id')
  async deleteSpecialTrivia(@Param('id') id: string): Promise<TriviaSpecial> {
    console.log('Deleting special trivia:', id);
    return this.specialService.deleteSpecialTrivia({ id: Number(id) });
  }
}
