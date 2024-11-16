import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Socket, Server } from 'socket.io';
  import { RoomsService } from 'src/rooms/rooms.service';
  import { UsersService } from 'src/users/users.service';
  import Client from 'ioredis';
  import Redlock from 'redlock';
  import { TopicsEnum } from '@prisma/client';
  import { QueueService } from 'src/queue/queue.service';
  import { RedisService } from 'src/redis/redis.service';
  import { SpecialService } from 'src/special/special.service';
  import { MessagesService } from 'src/messages/messages.service';
  import { QuestionsService } from 'src/questions/questions.service';
  import { ResponseService } from 'src/response/response.service';
  import { Interval } from '@nestjs/schedule';
  import { Logger } from '@nestjs/common';
  
  @WebSocketGateway()
  export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    redlock: Redlock;
    private readonly logger = new Logger(EventsGateway.name);
  
    constructor(
      private readonly usersService: UsersService,
      private readonly roomsService: RoomsService,
      private readonly queueService: QueueService,
      private readonly redisService: RedisService,
      private readonly specialService: SpecialService,
      private readonly messagesService: MessagesService,
      private readonly questionsService: QuestionsService,
      private readonly responseService: ResponseService,
    ) {
      const redisA = new Client({ host: 'localhost' });
      this.redlock = new Redlock([redisA], {
        driftFactor: 0.01,
        retryCount: 10,
        retryDelay: 200,
        retryJitter: 100,
        automaticExtensionThreshold: 500,
      });
  
      this.startBatchProcessing();
      this.startSpecialBatchProcessing();
    }
  
    async handleConnection(client: Socket) {
      const userId = client.handshake.query.userId as string;
  
      if (!userId) {
        console.log(
          'Connection: Player is not authenticated. Disconnecting client...',
        );
        client.disconnect();
        return;
      }
  
      console.log('Client is connected. Player ID: ', userId);
  
      try {
        await this.updateUserOnlineStatus(userId, true);
        client.emit('onlineStatus', { userId, status: 'online' });
  
        // Add user to the sockets map
        this.server.sockets.sockets.set(userId, client);
  
        await this.iterateUserTopics(userId, client); // Get waiting rooms for the player
        await this.fetchSpecialRooms(userId, client); // Get special trivias for the player
      } catch (err) {
        console.error('Error during connection handling:', err);
      }
    }
  
    async handleDisconnect(client: Socket) {
      const userId = client.handshake.query.userId as string;
  
      if (userId) {
        console.log(
          `Client disconnected! Client ID: ${client.id} | Player ID: ${userId}`,
        );
        await this.updateUserOnlineStatus(userId, false);
        client.emit('onlineStatus', { userId, status: 'offline' });
  
        // Remove the client ID association with the user ID
        this.server.sockets.sockets.delete(userId);
      }
    }
  
    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
      @MessageBody() data: { roomId: string; username: string },
      @ConnectedSocket() client: Socket,
    ): Promise<void> {
      const { userId } = client.handshake.query;
      // const username = client.handshake.query.username as string;
  
      if (!userId) {
        console.log(
          'Join Room: User is not authenticated. Disconnecting client...',
        );
        client.disconnect();
        return;
      }
  
      const { roomId, username } = data;
      console.log(`User ${username} is attempting to join room ${roomId}`);
  
      // Proceed to add user to the room
      // Add events to queue
      try {
        await this.redlock.using(
          [String(userId), roomId],
          5000,
          async (signal) => {
            this.queueService.addToQueue({ userId, roomId, username });
  
            if (signal.aborted) {
              throw signal.error;
            }
          },
        );
      } catch (err) {
        console.error('Error locking join room resource:', err);
      }
    }
  
    @SubscribeMessage('sendMessage')
    async handleSendMessage(
      @MessageBody()
      data: { roomId: string; text: string; createdAt: Date; messageId: any },
      @ConnectedSocket() client: Socket,
    ): Promise<void> {
      const userId = client.handshake.query.userId;
  
      if (!userId) {
        console.log(
          'Send Message: User is not authenticated. Disconnecting client...',
        );
        client.disconnect();
        return;
      }
  
      console.log('New message received:', data);
      console.log(client.rooms); // Logs all rooms the client is currently in
  
      const user = await this.fetchUserData(Number(userId));
  
      const { roomId, text, createdAt, messageId } = data;
  
      try {
        await this.redlock.using(
          [`send-message:${userId}`],
          1500,
          async (signal) => {
            const newMessage = await this.messagesService.createMessage({
              text,
              createdAt,
              user: { connect: { id: Number(userId) } },
              room: { connect: { id: Number(roomId) } },
              clientId: messageId,
            });
  
            // Construct the message with user data
            const message = {
              id: newMessage.id,
              text: newMessage.text,
              createdAt: newMessage.createdAt,
              user,
              system: newMessage.system,
              clientId: newMessage.clientId,
            };
  
            // this.server.to('testRoom').emit('testEvent', { message: 'Test message to test room!' });
            // this.server.to(this.getRoomLabel(roomId)).emit('testEvent', { message: 'Test message' });
  
            // console.log(`Emit message to room ${roomId}:`, message);
            this.server.to(this.getRoomLabel(roomId)).emit('newMessage', message);
  
            if (signal.aborted) {
              throw signal.error;
            }
          },
        );
      } catch (err) {
        console.error('Error during send message:', err);
      }
    }
  
    @Interval(1000)
    async processResponseQueue() {
      const batchSize = 10;
  
      while (this.queueService.getResponseQueueSize() > 0) {
        const responseBatch = this.queueService.getResponseBatch(batchSize);
  
        this.logger.log(`Processing batch of ${responseBatch.length} responses`);
  
        // Process the batch
        await Promise.all(
          responseBatch.map(async (response) => {
            const client = this.server.sockets.sockets.get(response.userId);
  
            try {
              await this.responseService.createResponse({
                user: { connect: { id: response.userId } },
                room: { connect: { id: response.roomId } },
                question: { connect: { id: response.questionId } },
                score: response.score,
                responseTime: response.responseTime,
              });
  
              // Fetch updated stats
              const scoreAndTimeStats = await this.responseService.getRoomStats(
                Number(response.roomId),
              );
  
              // Send the user stats for each user
              scoreAndTimeStats.forEach((userStat) => {
                client.emit('userStats', {
                  userId: userStat.userId,
                  score: userStat._sum.score,
                  responseTime: userStat._sum.responseTime,
                });
              });
  
              const leadingPlayer = scoreAndTimeStats[0];
              if (leadingPlayer) {
                this.server
                  .to(this.getRoomLabel(response.roomId))
                  .emit('leadingPlayer', {
                    userId: leadingPlayer.userId,
                    score: leadingPlayer._sum.score,
                  });
              }
            } catch (error) {
              this.logger.error('Error processing response:', error);
            }
          }),
        );
      }
    }
  
    @SubscribeMessage('submitResponse')
    async handleSubmitResponse(
      @ConnectedSocket() client: Socket,
      @MessageBody()
      data: {
        roomId: number;
        questionId: number;
        score: number;
        responseTime: number;
      },
    ) {
      const userId = client.handshake.query.userId as string;
  
      if (!userId) {
        console.log(
          'Submit Response: Player is not authenticated. Disconnecting client...',
        );
        client.disconnect();
        return;
      }
  
      try {
        const { roomId, questionId, score, responseTime } = data;
  
        // Add to respons queue
        this.queueService.addToResponseQueue({
          userId,
          roomId,
          questionId,
          score,
          responseTime,
        });
      } catch (error) {
        this.logger.error('Error occurred while submitting response:', error);
      }
    }
  
    /**
     * TriviaSpecial Events
     */
    @SubscribeMessage('joinSpecialTrivia')
    async handleJoinSpecialTrivia(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { specialId: string },
    ) {
      const userId = client.handshake.query.userId as string;
  
      if (!userId) {
        console.log(
          'Special Trivia: Player is not authenticated. Disconnecting client...',
        );
        client.disconnect();
        return;
      }
  
      try {
        const { specialId } = data;
  
        // Find a waiting room for this special trivia
        let specialRooms = await this.roomsService.getSpecialRooms(
          Number(specialId),
        );
        if (specialRooms) {
          this.queueService.addToSpecialQueue({
            userId,
            specialRoomId: specialRooms[0].id,
            specialId,
          });
        } else {
          try {
            await this.redlock.using(
              [`create-special-room:${specialId}`],
              5000,
              async (signal) => {
                const specialRoom = await this.roomsService.createSpecialRoom(
                  Number(specialId),
                );
                this.queueService.addToSpecialQueue({
                  userId,
                  specialRoomId: specialRoom.id,
                  specialId,
                });
  
                if (signal.aborted) {
                  throw signal.error;
                }
              },
            );
          } catch (err) {
            console.error('Error locking resource:', err);
          }
        }
      } catch (error) {
        console.error('Error during join special trivia:', error);
      }
    }
  
    /* For the web client test */
    @SubscribeMessage('htmlMessage')
    handleMessage(
      @MessageBody() message: any,
      @ConnectedSocket() client: Socket,
    ): void {
      console.log('Received message from client:', message);
      this.server.emit(
        'message',
        `Server received: ${JSON.stringify(message)} from client ${client.id}`,
      );
    }
  
    /**
     * Helper methods...
     */
    private async updateUserOnlineStatus(userId: string, isOnline: boolean) {
      // Check first if user is online
      const user = await this.usersService.user({ id: Number(userId) });
      if (user && !user.isOnline) {
        await this.usersService.updateUser({
          where: { id: Number(userId) },
          data: { isOnline },
        });
      }
    }
  
    private async fetchUserData(userId: number) {
      try {
        const user = await this.usersService.user({ id: userId });
        if (!user) {
          throw new Error(`User with id ${userId} not found.`);
        }
        return {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        };
      } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
      }
    }
  
    private async iterateUserTopics(userId: string, client: Socket) {
      const user = await this.usersService.user({ id: Number(userId) });
      if (user) {
        const topics =
          typeof user.topics === 'string' ? JSON.parse(user.topics) : user.topics;
  
        if (Array.isArray(topics)) {
          for (const topic of topics) {
            await this.createNewRoomIfNecessary(topic);
          }
          const waitingRooms = await this.usersService.getUserWaitingRooms(
            Number(userId),
          );
  
          // console.log('Send waiting rooms:', waitingRooms);
          client.emit('waitingRooms', waitingRooms);
        }
      }
    }
  
    private getRoomLabel(roomId: string | number) {
      return `room-${roomId}`;
    }
  
    private async createNewRoomIfNecessary(topic: TopicsEnum) {
      try {
        await this.redlock.using(
          [`create-room:${topic}`],
          5000,
          async (signal) => {
            let waitingRoom = await this.roomsService.rooms({
              where: { category: topic, state: 'waiting' },
              take: 1,
            });
  
            if (!waitingRoom || waitingRoom.length == 0) {
              const timestamp = Date.now().toString(16).substring(8);
              const roomName = `TriviaRoom ${topic} ${timestamp.toLocaleUpperCase()}`;
              waitingRoom = [
                await this.roomsService.createRoom({
                  title: roomName,
                  category: topic,
                  state: 'waiting',
                }),
              ];
  
              // create the moderator message for this room
              await this.messagesService.createMessage({
                text: 'Welcome to the room! Please follow the rules and enjoy your game. You can exchange greetings with other players before the game starts.',
                system: true,
                room: { connect: { id: waitingRoom[0].id } },
                user: { connect: { id: 3 } },
              });
            }
  
            if (signal.aborted) {
              throw signal.error;
            }
          },
        );
      } catch (err) {
        console.error('Error locking resource for creating new room:', err);
      }
    }
  
    private async getRoom(roomId: string) {
      const cacheKey = `room:${roomId}`;
      let room = await this.redisService.get<any>(cacheKey);
  
      if (!room) {
        room = await this.roomsService.room({ id: Number(roomId) });
        await this.redisService.set(cacheKey, room, 60); // Cache for 1 minute
      }
  
      return room;
    }
  
    // method to update cache for a room
    private async updateRoomCache(roomId: string) {
      const cacheKey = `room:${roomId}`;
      const room = await this.roomsService.room({ id: Number(roomId) });
      await this.redisService.set(cacheKey, room, 60); // Update the cache with new data
      console.log('Room cache updated');
      return room;
    }
  
    private async createNextRoomIfNecessary(room: any, participants: any[]) {
      if (participants.length === 1) {
        const topic = room.category;
        const timestamp = Date.now().toString(16).substring(8);
        const newRoomName = `TriviaRoom ${topic} ${timestamp.toLocaleUpperCase()}`;
  
        try {
          await this.redlock.using(
            [`create-next-room:${topic}`],
            5000,
            async (signal) => {
              const newRoom = await this.roomsService.createNextRoom({
                title: newRoomName,
                category: topic,
                state: 'waiting',
              });
  
              /* if (!newRoom) {
                console.log('Cannot create a new room while there are other waiting rooms. Skipping...');
                return;
              } */
  
              // create the moderator message for this room
              const tempMessageId: string =
                'system-message' + Date.now().toString();
  
              await this.messagesService.createMessage({
                text: 'Welcome to the room! Please follow the rules and enjoy your game. You can exchange greetings with other players before the game starts.',
                system: true,
                room: { connect: { id: newRoom.id } },
                user: { connect: { id: 3 } },
                clientId: tempMessageId,
              });
  
              this.server.emit('newRoom', { room: newRoom });
              await this.redisService.set(`room:${newRoom.id}`, newRoom, 60); // cache new room
  
              if (signal.aborted) {
                throw signal.error;
              }
            },
          );
        } catch (err) {
          console.error('Error locking resource:', err);
        }
      }
    }
  
    private async updateRoomStateWhenFull(roomId: string, participants: any[]) {
      if (participants.length === 2) {
        await this.roomsService.updateRoom({
          where: { id: Number(roomId) },
          data: { state: 'active' },
        });
  
        await this.updateRoomCache(roomId); // Update cache for room
  
        this.server
          .to(this.getRoomLabel(roomId))
          .emit('roomStatus', { roomId, status: 'active' });
  
        // Fetch a random set of questions for the room and send it to the room
        const room = await this.getRoom(roomId);
        const questions = await this.questionsService.getRandomQuestions(
          // room.category,
          'all',
          10,
        );
  
        this.server
          .to(this.getRoomLabel(roomId))
          .emit('triviaQuestions', { questions });
      }
    }
  
    private async processBatch(batch: any[]) {
      for (const item of batch) {
        const { userId, roomId, username } = item;
        const client = this.server.sockets.sockets.get(userId);
  
        if (!client) {
          console.error(`Client with userId ${userId} not found`);
          continue;
        }
  
        // client.join('testRoom');
  
        let room = await this.getRoom(roomId);
  
        if (!room) {
          client.emit('error', 'Room not found');
          continue;
        }
  
        console.log('Processing batch: Room found ➡', room.title);
  
        // Check if user is in room
        const isUserInRoom = await this.roomsService.isUserInRoom(
          Number(userId),
          Number(roomId),
        );
        if (isUserInRoom) {
          console.log(`User ${username} is already in room ${roomId}`);
          client.join(this.getRoomLabel(roomId));
          client.emit('joinedRoom', room);
          return;
        }
  
        const participants = await this.roomsService.getRoomParticipants(
          Number(roomId),
        );
  
        if (participants.length >= 8) {
          client.emit('error', 'This TriviaRoom is full');
          continue;
        }
  
        try {
          await this.redlock.using(
            [`room-participant:${roomId}`],
            5000,
            async (signal) => {
              console.log(`Locking resource ➡ room-participant:${roomId}...`);
  
              await this.roomsService.createRoomParticipant({
                user: { connect: { id: Number(userId) } },
                room: { connect: { id: Number(roomId) } },
              });
  
              // create a system message that this user has joined the room
              // Check first if message exists in the db
              const notificationText = `${username} has joined the room.`;
              const userJoinedMessageExists =
                await this.messagesService.checkMessageText(
                  notificationText,
                  Number(userId),
                  Number(roomId),
                );
  
              const tempMessageId: string =
                'system-message' + Date.now().toString();
  
              if (!userJoinedMessageExists) {
                const message = await this.messagesService.createMessage({
                  text: notificationText,
                  system: true,
                  room: { connect: { id: Number(roomId) } },
                  user: { connect: { id: Number(userId) } },
                  clientId: tempMessageId,
                });
  
                this.server
                  .to(this.getRoomLabel(roomId))
                  .emit('newMessage', message);
              }
  
              this.server.emit('roomUpdated', room);
  
              if (signal.aborted) {
                throw signal.error;
              }
            },
          );
        } catch (error) {
          console.error('Error locking resource ➡ room participant:', error);
        }
  
        const updatedParticipants = await this.roomsService.getRoomParticipants(
          Number(roomId),
        );
  
        // Update the room cache
        room = await this.updateRoomCache(roomId);
  
        client.join(this.getRoomLabel(roomId));
        client.emit('joinedRoom', room);
  
        await this.createNextRoomIfNecessary(room, updatedParticipants);
        await this.updateRoomStateWhenFull(roomId, updatedParticipants);
      }
    }
  
    private startBatchProcessing() {
      setInterval(async () => {
        if (this.queueService.getQueueSize() > 0) {
          const batch = this.queueService.getBatch(10);
          console.log(`Processing batch of size ${batch.length}`);
          await this.processBatch(batch);
        }
      }, 5000);
    }
  
    /**
     * Helper methods for specialTrivia
     */
  
    // Fetch special trivias
    private async fetchSpecialRooms(userId: string, client: Socket) {
      const specialTrivias = await this.specialService.specialTrivias({
        where: {
          OR: [{ gameStatus: 'upcoming' }, { gameStatus: 'open' }],
        },
        orderBy: { createdAt: 'desc' },
      });
  
      client.emit('specialTrivias', specialTrivias);
    }
  
    // Get a special room
    private async getSpecialRoom(roomId: number) {
      const cacheKey = `specialRoom:${roomId}`;
      let room = await this.redisService.get<any>(cacheKey);
  
      if (!room) {
        room = await this.roomsService.specialRoom({ id: roomId });
        await this.redisService.set(cacheKey, room, 60); // Cache for 1 minute
      }
  
      return room;
    }
  
    private async startSpecialRoomWhenFull(
      playersPerRoom: number,
      specialRoomId: number,
      players: any[],
    ) {
      if (players.length >= playersPerRoom) {
        await this.roomsService.updateRoom({
          where: { id: specialRoomId },
          data: { state: 'active' },
        });
      }
    }
  
    private async createNewSpecialRoomForPlayer(
      userId: string,
      specialId: string,
      specialRoom: any,
      players: any[],
    ) {
      if (players.length >= specialRoom.playersPerRoom) {
        try {
          await this.redlock.using(
            [`create-special-room:${specialId}`],
            5000,
            async (signal) => {
              const specialRoom = await this.roomsService.createSpecialRoom(
                Number(specialId),
              );
              this.queueService.addToSpecialQueue({
                userId,
                specialRoomId: specialRoom.id,
                specialId,
              });
  
              if (signal.aborted) {
                throw signal.error;
              }
            },
          );
        } catch (err) {
          console.error('Error locking resource:', err);
        }
      }
    }
  
    // Process special batch
    private async processSpecialBatch(batch: any[]) {
      for (const item of batch) {
        const { userId, specialRoomId, specialId } = item;
        const client = this.server.sockets.sockets.get(userId);
  
        if (!client) {
          console.error(`Client with userId ${userId} not found`);
          continue;
        }
  
        const specialRoom = await this.getSpecialRoom(specialRoomId);
        if (!specialRoom) {
          client.emit('error', 'Special Trivia Room not found');
          continue;
        }
  
        const players = await this.roomsService.getSpecialPlayers(
          Number(specialRoomId),
        );
        if (players.length >= specialRoom.playersPerRoom) {
          client.emit('error', 'This Special Trivia Room is full');
          continue;
        }
  
        await this.roomsService.createSpecialPlayer({
          user: { connect: { id: Number(userId) } },
          room: { connect: { id: Number(specialRoomId) } },
          specialTrivia: { connect: { id: Number(specialId) } },
          playerTime: 0,
        });
  
        const updatedPlayers = await this.roomsService.getSpecialPlayers(
          Number(specialRoomId),
        );
  
        this.server.to(String(specialRoomId)).emit('specialPlayers', {
          specialRoomId,
          specialPlayers: updatedPlayers,
        });
  
        await this.redisService.set(
          `specialRoom:${specialRoomId}:players`,
          updatedPlayers,
          60,
        ); // Cache players
  
        client.join(specialRoomId.toString());
        client.emit('joinedSpecialRoom', { specialRoomId });
  
        await this.startSpecialRoomWhenFull(
          specialRoom.playersPerRoom,
          specialRoomId,
          updatedPlayers,
        );
        await this.createNewSpecialRoomForPlayer(
          userId,
          specialId,
          specialRoom,
          updatedPlayers,
        );
      }
    }
  
    // Start special batch processing
    private async startSpecialBatchProcessing() {
      setInterval(async () => {
        if (this.queueService.getSpecialQueueSize() > 0) {
          const batch = this.queueService.getSpecialBatch(10);
          console.log(`Processing special trivia batch of size ${batch.length}`);
          await this.processSpecialBatch(batch);
        }
      }, 5000);
    }
  }
  