import { Injectable, Logger } from '@nestjs/common';
import { Prisma, Response } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ResponseService {
  private readonly logger = new Logger(ResponseService.name);
  constructor(private prisma: PrismaService) {}

  async createResponse(data: Prisma.ResponseCreateInput): Promise<Response> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Find the current fastest response with a score of 11
        const fastestResponseWith11 = await prisma.response.findFirst({
          where: {
            roomId: data.room.connect.id,
            questionId: data.question.connect.id,
            score: 11,
          },
          orderBy: { responseTime: 'asc' },
        });

        if (fastestResponseWith11) {
          // If the new response is faster and a correct score, 
          // update the old response and create the new one with a score of 11
          if (
            data.responseTime < fastestResponseWith11.responseTime &&
            data.score === 1
          ) {
            await prisma.response.update({
              where: { id: fastestResponseWith11.id },
              data: { score: 1 },
            });

            return prisma.response.create({
              data: {
                ...data,
                score: 11,
              },
            });
          } else {
            // If the new response is slower, 
            // whether correct or wrong, 
            // create the response with the original score
            return prisma.response.create({ data });
          }
        } else {
          // If there's no response with a score of 11, assign the score of 11 to the new response
          if (data.score === 1) {
            return prisma.response.create({
              data: {
                ...data,
                score: 11,
              },
            });
          } else {
            return prisma.response.create({ data });
          }
        }
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateResponse(data: Prisma.ResponseUpdateInput): Promise<Response> {
    return this.prisma.response.update({
      data,
      where: {
        roomId_questionId_userId: {
          roomId: data.room.connect.id,
          questionId: data.question.connect.id,
          userId: data.user.connect.id,
        },
      },
    });
  }

  async getRoomStats(roomId: number) {
    return this.prisma.response.groupBy({
      by: ['userId'],
      where: { roomId },
      _sum: {
        score: true,
        responseTime: true,
      },
      orderBy: {
        _sum: {
          score: 'desc',
        },
      },
    });
  }

  // Get responses data for a given room, grouping the data by the users and ordering by the sum of score

  private handleError(error: any): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        this.logger.warn(
          'Response already exists for the given question in the specified room by the current user',
        );
      } else {
        this.logger.error('Error creating response', error);
        throw new Error('Error creating response!');
      }
    } else {
      this.logger.error('Unexpected error:', error);
      throw new Error('Unexpected error!');
    }
  }
}
