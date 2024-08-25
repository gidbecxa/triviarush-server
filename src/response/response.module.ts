import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ResponseService } from './response.service';

@Module({
    imports: [PrismaModule],
    providers: [ResponseService],
    exports: [ResponseService]
})
export class ResponseModule {}
