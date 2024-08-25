import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { QuestionsService } from './questions.service';

@Module({
    imports: [PrismaModule],
    // controllers: [],
    providers: [QuestionsService],
    exports: [QuestionsService],
})
export class QuestionsModule {}
