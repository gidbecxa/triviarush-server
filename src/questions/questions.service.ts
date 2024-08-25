import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Question, TopicsEnum } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async question(
    questionWhereUniqueInput: Prisma.QuestionWhereUniqueInput,
  ): Promise<Question | null> {
    return this.prisma.question.findUnique({
      where: questionWhereUniqueInput,
    });
  }

  async questions(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.QuestionWhereUniqueInput;
    where?: Prisma.QuestionWhereInput;
    orderBy?: Prisma.QuestionOrderByWithRelationInput;
  }): Promise<Question[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.question.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async getRandomQuestions(
    category: TopicsEnum,
    count: number,
  ): Promise<Question[]> {
    // Fetch the total count of questions in the category
    const totalQuestions = await this.prisma.question.count({
      where: { category },
    });

    // Select random questions based on the count
    let randomSkip = Math.floor(Math.random() * (totalQuestions - count + 1));
    randomSkip = Math.abs(randomSkip);

    return this.prisma.question.findMany({
      take: count,
      skip: randomSkip,
      where: { category },
      orderBy: { id: 'asc' },
    });
  }

  async createQuestion(data: Prisma.QuestionCreateInput): Promise<Question> {
    return this.prisma.question.create({
      data,
    });
  }

  async updateQuestion(params: {
    where: Prisma.QuestionWhereUniqueInput;
    data: Prisma.QuestionUpdateInput;
  }): Promise<Question> {
    const { where, data } = params;
    return this.prisma.question.update({
      data,
      where,
    });
  }

  async deleteQuestion(
    where: Prisma.QuestionWhereUniqueInput,
  ): Promise<Question> {
    return this.prisma.question.delete({
      where,
    });
  }
}
