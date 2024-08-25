import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, Prisma, PlayerLevel, TopicsEnum } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('user/:id')
  async findOne(@Param('id') id: string): Promise<User> {
    console.log('Fetching user...');
    return this.usersService.user({ id: Number(id) });
  }

  @Get()
  async findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('cursor') cursor?: Prisma.UserWhereUniqueInput,
    @Query('where') where?: Prisma.UserWhereInput,
    @Query('orderBy') orderBy?: Prisma.UserOrderByWithRelationInput,
  ): Promise<User[]> {
    console.log('Fetching users...');
    return this.usersService.users({
      skip: skip,
      take: take,
      cursor: cursor,
      where: where ? where : undefined,
      orderBy: orderBy ? orderBy : { id: 'desc' },
    });
  }

  // Get users by level from the highest points to the lowest
  @Get('byLevel')
  async getUsersByLevel(
    @Query('level') level: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('cursor') cursor?: Prisma.UserWhereUniqueInput,
  ): Promise<User[]> {
    console.log('Fetching users by level...');
    return this.usersService.users({
      skip,
      take,
      cursor,
      where: {
        skillLevel: level as PlayerLevel,
      },
      orderBy: {
        points: 'desc',
      },
    });
  }

  // Get users for a particular topic from the user with the highest points to the lowest
  @Get('by-topic')
  async getUsersByTopic(
    @Query('topic') topic: TopicsEnum,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('cursor') cursor?: Prisma.UserWhereUniqueInput,
    // @Query('where') where?: Prisma.UserWhereInput,
    @Query('orderBy') orderBy?: Prisma.UserOrderByWithRelationInput,
  ): Promise<User[]> {
    console.log('Fetching users for topic:', topic);
    return this.usersService.users({
      skip,
      take,
      cursor,
      where: { topics: { array_contains: topic } },
      orderBy: orderBy ? orderBy : { points: 'desc' },
    });
  }

  @Get('user/:id/waiting-rooms')
  async getWaitingRooms(@Param('id', ParseIntPipe) id: number) {
    console.log('Fetching waiting rooms for user:', id);
    return this.usersService.getUserWaitingRooms(id);
  }

  @Post('newUser')
  async create(@Body() data: Prisma.UserCreateInput): Promise<User> {
    console.log('Creating user...');
    return this.usersService.createUser(data);
  }

  @Patch('user/:id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.UserUpdateInput,
  ): Promise<User> {
    console.log('Updating user...');
    return this.usersService.updateUser({
      where: { id: Number(id) },
      data,
    });
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: string): Promise<User> {
    console.log('Deleting user...');
    return this.usersService.deleteUser({ id: Number(id) });
  }
}
