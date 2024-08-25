import { Injectable } from '@nestjs/common';
import { Prisma, Room, RoomParticipant, SpecialPlayer, SpecialRoom } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomsService {
    constructor(private prisma: PrismaService) { }

    async room(
        roomWhereUniqueInput: Prisma.RoomWhereUniqueInput,
    ): Promise<Room | null> {
        return this.prisma.room.findUnique({
            where: roomWhereUniqueInput,
            include: {
                participants: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                            }
                        },
                    }
                },
                messages: {
                    select: {
                        id: true,
                        text: true,
                        createdAt: true,
                        system: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatar: true,
                            }
                        }
                    }
                },
            }
        });
    }

    async rooms(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.RoomWhereUniqueInput;
        where?: Prisma.RoomWhereInput;
        orderBy?: Prisma.RoomOrderByWithRelationInput;
    }): Promise<Room[]> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.room.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: {
                participants: true,
            }
        });
    }

    async createRoom(data: Prisma.RoomCreateInput): Promise<Room> {
        return await this.prisma.$transaction(async (prisma) => {
            const existingRoom = await prisma.room.findFirst({
                where: { category: data.category, state: 'waiting' },
            });

            if (existingRoom) {
                console.log('Cannot create new room: There\'s a waiting room for this topic');
                return existingRoom;
            }

            return prisma.room.create({ data });
        });
    }

    async createNextRoom(data: Prisma.RoomCreateInput): Promise<Room> {
        return await this.prisma.$transaction(async (prisma) => {
            const existingRoom = await prisma.room.findFirst({
                where: { idempotencyId: data.idempotencyId },
            });

            if (existingRoom) {
                console.log('DB has identified an idempotent transaction! This room exists already.');
                return;
            }

            // Check and limit the number of waiting rooms
            // Check if there are more than 2 waiting rooms
            // const waitingRooms = await prisma.room.findMany({
            //     where: { category: data.category, state: 'waiting' },
            //     orderBy: { createdAt: 'asc' },
            // });

            // if (waitingRooms.length >= 3) { // Or 2
            //     console.log(`Cannot create a new room for the ${data.category} category! 3 or more waiting rooms found. Skipping...`)
            //     return;
            // }

            return prisma.room.create({ data });
        });
    }

    async updateRoom(params: {
        where: Prisma.RoomWhereUniqueInput;
        data: Prisma.RoomUpdateInput;
    }): Promise<Room> {
        const { where, data } = params;
        return this.prisma.room.update({
            where,
            data
        });
    }

    async deleteRoom(where: Prisma.RoomWhereUniqueInput): Promise<Room> {
        return this.prisma.room.delete({
            where
        });
    }

    // Create room participants implementing transaction
    // Checks first if the user is already in the room
    async createRoomParticipant(data: Prisma.RoomParticipantCreateInput): Promise<RoomParticipant> {
        return await this.prisma.$transaction(async (prisma) => {
            const { user, room } = data;
            const userId = user.connect.id;
            const roomId = room.connect.id;

            const existingParticipant = await prisma.roomParticipant.findFirst({
                where: { userId, roomId },
            });

            if (existingParticipant) {
                console.log('User is already in this room');
                return existingParticipant;
            }

            return prisma.roomParticipant.create({ data });
        });
    };

    async getRoomParticipants(roomId: number): Promise<RoomParticipant[]> {
        return this.prisma.roomParticipant.findMany({
            where: {
                roomId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        bio: true,
                        skillLevel: true,
                    }
                },
            }
        });
    }

    // Check if a user is in a room
    async isUserInRoom(userId: number, roomId: number): Promise<boolean> {
        const participant = await this.prisma.roomParticipant.findFirst({
            where: { userId, roomId },
        });

        return !!participant;
    }

    // Check if a room exists by an idempotency ID
    async roomWithUidCreated(idempotencyId: string): Promise<boolean> {
        const roomWithUidCreated = await this.prisma.room.findFirst({
            where: { idempotencyId },
        });

        return !!roomWithUidCreated
    }

    // Create a special room
    async createSpecialRoom(specialId: number): Promise<SpecialRoom> {
        return await this.prisma.$transaction(async (prisma) => {
            const existingRoom = await prisma.specialRoom.findFirst({
                where: { specialId, state: 'waiting' },
            });

            if (existingRoom) {
                console.log('There\'s an existing waiting room for this special trivia');
                return existingRoom;
            }

            const newSpecialRoom = await prisma.specialRoom.create({
                data: {
                    specialId,
                    state: 'waiting',
                }
            });

            return newSpecialRoom;
        });
    }

    // Get special rooms
    async getSpecialRooms(specialId: number): Promise<SpecialRoom[]> {
        return this.prisma.specialRoom.findMany({
            where: {
                specialId,
                state: 'waiting',
            },
            include: {
                specialTrivia: true,
            },
            orderBy: {
                createdAt: 'asc',
            }
        });
    }

    // Get a special room
    async specialRoom(
        roomWhereUniqueInput: Prisma.SpecialRoomWhereUniqueInput,
    ): Promise<SpecialRoom | null> {
        return this.prisma.specialRoom.findUnique({
            where: roomWhereUniqueInput,
            include: {
                participants: true,
            }
        });
    }

    // Insert a new special player
    async createSpecialPlayer(data: Prisma.SpecialPlayerCreateInput): Promise<SpecialPlayer> {
        return this.prisma.specialPlayer.create({
            data
        });
    }

    // Get special players
    async getSpecialPlayers(specialId: number): Promise<SpecialPlayer[]> {
        return this.prisma.specialPlayer.findMany({
            where: {
                specialId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        bio: true,
                        skillLevel: true,
                    }
                },
            },
            orderBy: {
                playerTime: 'asc',
            }
        });
    }
}