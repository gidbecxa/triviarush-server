import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User, Prisma, Room, TopicsEnum } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  // Get 'waiting' rooms for user
  async getUserWaitingRooms(userId: number): Promise<Room[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { topics: true },
    });

    if (!user) {
      throw new Error(`User not found`);
    }

    // Fetch rooms that match the user's topics and are in 'waiting' state
    const topics = Array.isArray(user.topics) ? user.topics as TopicsEnum[] : [user.topics] as TopicsEnum[];
    // const topics = user.topics as TopicsEnum[]
    const waitingRooms = await this.prisma.room.findMany({
      where: {
        category: { in: topics },
        state: 'waiting',
      },
      include: { participants: true },
      orderBy: {
        participants: {
          _count: 'desc',
        },
      },
    });

    return waitingRooms;
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }
}
