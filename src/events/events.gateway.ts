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
import { Interval, SchedulerRegistry } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  redlock: Redlock;
  private readonly logger = new Logger(EventsGateway.name);
  private triviaDynamicIntervalId: string = 'processResponseQueueInterval';

  constructor(
    private readonly usersService: UsersService,
    private readonly roomsService: RoomsService,
    private readonly queueService: QueueService,
    private readonly redisService: RedisService,
    private readonly specialService: SpecialService,
    private readonly messagesService: MessagesService,
    private readonly questionsService: QuestionsService,
    private readonly responseService: ResponseService,
    private readonly schedulerRegistry: SchedulerRegistry,
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
    this.startProcessResponseDynamicInterval();
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

  @SubscribeMessage('fetchRooms')
  async fetcUserhRooms(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!userId) {
      console.log(
        'Fetch Rooms: User is not authenticated. Disconnecting client...',
      );
      client.disconnect();
      return;
    }

    await this.iterateUserTopics(userId, client); // Get waiting rooms for the player
    await this.fetchSpecialRooms(userId, client); // Get special trivias for the player
  }

  async withRedlock(lockKey: string, timeout: number, fn: () => Promise<void>) {
    try {
      await this.redlock.using([lockKey], timeout, async (signal) => {
        await fn();
        if (signal.aborted) {
          throw signal.error;
        }
      });
    } catch (error) {
      console.error(`Error locking resource ➡ ${lockKey}:`, error);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string; username: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { userId, idempotencyId } = client.handshake.query;

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
        1000,
        async (signal) => {
          this.queueService.addToQueue({
            userId,
            roomId,
            username,
            idempotencyId,
          });

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

    await this.withRedlock(
      `send-message:${userId}-${roomId}`,
      1000,
      async () => {
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
      },
    );
  }

  /**
   * Methods for processing the response batch
   * Implements dynamic interval
   */

  // Method to start the dynamic interval
  startProcessResponseDynamicInterval() {
    console.log('Starting dynamic processing for responses...');

    const currentInterval = this.schedulerRegistry.doesExist(
      'interval',
      this.triviaDynamicIntervalId,
    );

    if (currentInterval) {
      this.logger.warn(
        'processResponseQueueInterval already exists! Skipping...',
      );
      return;
    }

    const interval = setInterval(() => this.processResponseQueue(), 5000); // Default interval
    this.schedulerRegistry.addInterval(this.triviaDynamicIntervalId, interval);
  }

  // Method to adjust the interval dynamically
  adjustInterval(newInterval: number) {
    const currentInterval = this.schedulerRegistry.getInterval(
      this.triviaDynamicIntervalId,
    );
    clearInterval(currentInterval);
    this.schedulerRegistry.deleteInterval(this.triviaDynamicIntervalId);

    const interval = setInterval(
      () => this.processResponseQueue(),
      newInterval,
    );
    this.schedulerRegistry.addInterval(this.triviaDynamicIntervalId, interval);

    this.logger.log(
      `Interval for response batch processing adjusted to ${newInterval} ms`,
    );
  }

  // Method to stop the interval
  stopProcessResponseDynamicInterval() {
    const interval = this.schedulerRegistry.getInterval(
      this.triviaDynamicIntervalId,
    );
    clearInterval(interval);
    this.schedulerRegistry.deleteInterval(this.triviaDynamicIntervalId);
  }

  async processResponseQueue() {
    const queueSize = this.queueService.getResponseQueueSize();
    // this.logger.log(`Process response queue. Size = ${queueSize}`);

    // Exit if the queue is empty to avoid unnecessary processing, log this behavior
    if (queueSize === 0) {
      // this.logger.log('No responses in queue to process.');
      return;
    }

    const baseInterval = 5000; // default interval

    let interval = baseInterval;
    let batchSize = 200; // Default batch size
    let maxBatchesPerInterval = 10; // Default max batches

    // Adjust the interval based on the queue size
    // Smaller queue, longer interval to process all responses
    // Larger queue, shorter interval to manage the load
    // 8 players per room, 80 responses per room
    // The breakpoint stars from 10 active rooms max

    if (queueSize <= 80) {
      interval = 10000; // 10 seconds
      batchSize = 20;
      maxBatchesPerInterval = 4;
    } else if (queueSize <= 800) {
      interval = 7250; // 7.5 seconds - 250ms (delay between processing batches)
      batchSize = 40;
      maxBatchesPerInterval = 10;
    } else if (queueSize <= 8000) {
      interval = 4750; // 5 seconds - 250ms (delay between processing batches)
      batchSize = 200;
      maxBatchesPerInterval = 10;
    } else {
      interval = Math.max(1000, 15000 / (queueSize / 8000)); // Scale down interval as needed, min 1 second
      batchSize = Math.min(1000, queueSize / 10); // Increase batch size
      maxBatchesPerInterval = Math.min(100, Math.floor(queueSize / batchSize)); // Adjust max batches
    }

    this.adjustInterval(interval);

    this.logger.log(
      `Processing with interval: ${interval} ms, batch size: ${batchSize}, max batches: ${maxBatchesPerInterval}`,
    );

    let batchesProcessed = 0;

    while (queueSize > 0 && batchesProcessed < maxBatchesPerInterval) {
      const responseBatch = this.queueService.getResponseBatch(batchSize);
      this.logger.log(`Processing batch of ${responseBatch.length} responses`);

      // Process the batch with error handling and retries
      const results = await Promise.allSettled(
        responseBatch.map(async (response) => {
          const client = this.server.sockets.sockets.get(response.userId);

          const lockKey = `create-response:${response.userId}`;

          // Check if the room creation is already in progress
          const isCreatingResponse = await this.redisService.get(lockKey);
          if (isCreatingResponse) {
            console.log(
              `Submitting response already in progress for this user!`,
            );
            return;
          }

          try {
            await this.responseService.createResponse({
              user: { connect: { id: Number(response.userId) } },
              room: { connect: { id: Number(response.roomId) } },
              question: { connect: { id: Number(response.questionId) } },
              score: response.score,
              responseTime: response.responseTime,
            });

            // Fetch updated stats
            const scoreAndTimeStats = await this.responseService.getRoomStats(
              Number(response.roomId),
            );
            // console.log('Fetched stats:', scoreAndTimeStats);

            // Send the user stats for each user
            if (client) {
              // Emit user-specific stats if client is connected
              const userStat = scoreAndTimeStats.find(
                (stat) => stat.userId === Number(response.userId),
              );
              console.log("User's stats: ", userStat);

              if (userStat) {
                client.emit('userStats', {
                  userId: userStat.userId,
                  score: userStat._sum.score,
                  responseTime: userStat._sum.responseTime,
                });

                // Update the user's score
                await this.usersService.updateUser({
                  where: { id: Number(userStat.userId) },
                  data: { points: { increment: userStat._sum.score } },
                });
              }
            } else {
              this.logger.warn(
                `Client ${response.userId} is disconnected. Stats will be cached.`,
              );
            }

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
          } finally {
            await this.redisService.del(lockKey);
          }
        }),
      );

      // Handle rejected promises separately
      results.forEach((result) => {
        if (result.status === 'rejected') {
          this.logger.error(
            "Error while processing a response's batch:",
            result.reason,
          );
          // Handle the error appropriately... TODO later...
        }
      });

      batchesProcessed++;

      // Add a small delay between processing batches to prevent bocking
      await new Promise((resolve) => setTimeout(resolve, 250));
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
      this.logger.warn(
        'Submit Response: Player is not authenticated. Disconnecting client...',
      );
      client.disconnect();
      return;
    }

    try {
      const { roomId, questionId, score, responseTime } = data;

      // Input validation
      if (
        !roomId ||
        !questionId ||
        score === undefined ||
        responseTime === undefined
      ) {
        this.logger.warn('Invalid data submitted by client:', data);
        client.emit('error', { message: 'Invalid data submitted.' });
        return;
      }

      // Add to respons queue
      this.queueService.addToResponseQueue({
        userId,
        roomId,
        questionId,
        score,
        responseTime,
      });

      this.logger.log(
        `Submit Response: Response added to queue for user ${userId}, room ${roomId}, question ${questionId}`,
      );
    } catch (error) {
      this.logger.error('Error occurred while submitting response:', error);
      client.emit('error', {
        message: 'An error occurred while submitting your response.',
      });
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
    console.log("Fetching room's for user's rooms...");
    const user = await this.usersService.user({ id: Number(userId) });
    if (user) {
      const topics =
        typeof user.topics === 'string' ? JSON.parse(user.topics) : user.topics;

      if (Array.isArray(topics)) {
        for (const topic of topics) {
          console.log("User's topics found: ", topic);
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
    await this.withRedlock(`new-room:${topic}`, 5000, async () => {
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
          user: { connect: { id: 1 } },
        });
      }
    });
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

  private async createNextRoomIfNecessary(
    room: any,
    participants: any[],
    idempotencyId: string,
  ) {
    if (participants.length === 1) {
      const topic = room.category;
      const lockKey = `create-room:${topic}`;

      // Check if the room creation is already in progress
      const isCreatingRoom = await this.redisService.get(lockKey);
      if (isCreatingRoom) {
        console.log(
          `Room creation for category ${topic} is already in progress.`,
        );
        return;
      }

      // Set the lock with an expiration time to avoid duplicate room creation
      await this.redisService.set(lockKey, true, 5);

      const timestamp = Date.now().toString(16).substring(8);
      const newRoomName = `TriviaRoom ${topic} ${timestamp.toLocaleUpperCase()}`;

      try {
        await this.withRedlock(`next-room:${topic}`, 5000, async () => {
          // check first if there are 3 or more waiting rooms
          const waitingRooms = await this.roomsService.rooms({
            where: { category: topic, state: 'waiting' },
          });

          if (waitingRooms.length >= 3) {
            console.log(
              `Cannot create a new room for the ${topic} category! 3 or more waiting rooms found. Skipping...`,
            );
            return;
          }

          // Then, check if there is any room with the given idempotency UUID
          const roomWithUidCreated =
            await this.roomsService.roomWithUidCreated(idempotencyId);

          if (roomWithUidCreated) {
            console.log(
              'Idempotency: This room has been created already! Skip',
            );
            return;
          }

          const newRoom = await this.roomsService.createNextRoom({
            title: newRoomName,
            category: topic,
            state: 'waiting',
            idempotencyId,
          });

          if (!newRoom) return;

          // create the moderator message for this room
          const tempMessageId: string =
            'system-message' + Date.now().toString();

          await this.messagesService.createMessage({
            text: 'Welcome to the room! Please follow the rules and enjoy your game. You can exchange greetings with other players before the game starts.',
            system: true,
            room: { connect: { id: newRoom.id } },
            user: { connect: { id: 1 } },
            clientId: tempMessageId,
          });

          this.server.emit('newRoom', { room: newRoom });
          await this.redisService.set(`room:${newRoom.id}`, newRoom, 60); // cache new room
        });
      } catch (err) {
        console.error('Failed to create the next room. An error occured!', err);
      } finally {
        await this.redisService.del(lockKey);
      }
    }
  }

  // Fisher-Yates shuffle algorithm
  private shuffleArray(array: any[]) {
    let currentIndex = array.length,
      randomIndex: number;

    while (currentIndex !== 0) {
      //Pick a random element
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    console.log('Shuffled array:', array);
    return array;
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

      // Apply the shuffle to the options
      const questionsWithShuffledOptions = questions.map((question) => {
        let optionsArray = JSON.parse(question.options as string);
        optionsArray = this.shuffleArray(optionsArray);
        question.options = JSON.stringify(optionsArray);
        return question;
      });

      this.server
        .to(this.getRoomLabel(roomId))
        .emit('triviaQuestions', { questions: questionsWithShuffledOptions });
    }
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

  /**
   * BATCH PROCESSING...
   */

  private async processBatch(batch: any[]) {
    for (const item of batch) {
      const { userId, roomId, username, idempotencyId } = item;
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

      if (participants.length >= 2) {
        client.emit('error', 'This TriviaRoom is full');
        continue;
      }

      await this.withRedlock(`new-participant:${roomId}`, 5000, async () => {
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

        const tempMessageId: string = 'system-message' + Date.now().toString();

        if (!userJoinedMessageExists) {
          const message = await this.messagesService.createMessage({
            text: notificationText,
            system: true,
            room: { connect: { id: Number(roomId) } },
            user: { connect: { id: Number(userId) } },
            clientId: tempMessageId,
          });

          this.server.to(this.getRoomLabel(roomId)).emit('newMessage', message);
        }
      });

      const updatedParticipants = await this.roomsService.getRoomParticipants(
        Number(roomId),
      );

      // Update the room cache
      room = await this.updateRoomCache(roomId);

      client.join(this.getRoomLabel(roomId));
      client.emit('joinedRoom', room);
      this.server.emit('roomUpdated', room);

      await this.createNextRoomIfNecessary(
        room,
        updatedParticipants,
        idempotencyId,
      );
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
