import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Message } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  // Create a new message, implementing a DB transaction
  async createMessage(data: Prisma.MessageCreateInput): Promise<Message> {
    return await this.prisma.$transaction(async (prisma) => {
      const existingMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { system: false, clientId: data.clientId, },
            {
              text: data.text,
              roomId: data.room.connect.id,
              system: true,
            },
          ],
        },
      });

      if (existingMessage) {
        console.log('Message duplicate detected! Ignore...');
        return existingMessage;
      }

      return prisma.message.create({
        data,
      });
    });
  }

  async messages(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.MessageWhereUniqueInput;
    where?: Prisma.MessageWhereInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput;
  }): Promise<Message[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.message.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async deleteMessage(where: Prisma.MessageWhereUniqueInput): Promise<Message> {
    return this.prisma.message.delete({
      where,
    });
  }

  // Check if there's a given system message text for a user in the database
  async checkMessageText(
    text: string,
    userId: number,
    roomId: number,
  ): Promise<boolean> {
    const message = await this.prisma.message.findFirst({
      where: {
        text,
        userId,
        roomId,
        system: true,
      },
    });
    return !!message;
  }
}
