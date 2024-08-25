import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SpecialController } from './special.controller';
import { SpecialService } from './special.service';

@Module({
    imports: [PrismaModule],
    controllers: [SpecialController],
    providers: [SpecialService],
    exports: [SpecialService]
})
export class SpecialModule {}
