import { Controller, Get, Param, Query } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { skip } from 'node:test';
import { Prisma, Room } from '@prisma/client';

@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) { }

    @Get()
    getAll(
        @Query('skip') skip?: number,
        @Query('take') take?: number,
        @Query('cursor') cursor?: Prisma.RoomWhereUniqueInput,
        @Query('where') where?: Prisma.RoomWhereInput,
        @Query('orderBy') orderBy?: Prisma.RoomOrderByWithRelationInput,
    ): Promise<Room[]> {
        console.log('Getting all rooms...');
        return this.roomsService.rooms({
            skip: Number(skip) || undefined,
            take: Number(take) || undefined,
            cursor,
            where,
            orderBy: orderBy || { createdAt: 'desc' },
        });
    }

    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.roomsService.room({ id: Number(id) });
    }

    @Get(':id/players')
    getPlayers(@Query('roomId') roomId: string) {
        return this.roomsService.getRoomParticipants(Number(roomId));
    }
}
