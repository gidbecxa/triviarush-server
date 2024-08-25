import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway()
  export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    handleConnection(client: Socket) {
      console.log(`Client connected: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      console.log(`Client disconnected: ${client.id}`);
    }
  
    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: Socket, room: string) {
      client.join(room);
      this.server.to(room).emit('message', `${client.id} has joined the room ${room}`);
    }
  
    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(client: Socket, room: string) {
      client.leave(room);
      this.server.to(room).emit('message', `${client.id} has left the room ${room}`);
    }
  
    @SubscribeMessage('sendMessage')
    handleMessage(client: Socket, message: { room: string; content: string }) {
      this.server.to(message.room).emit('message', message.content);
    }
  }
  

/* const { roomId } = data;
const room = await this.getRoom(roomId);
if (!room) {
    client.emit('error', 'Room not found');
    return;
}

// Count participants in the room
const participants = await this.roomsService.getRoomParticipants(Number(data.roomId));
if (participants.length >= 8) {
    client.emit('error', 'This TriviaRoom is full');
    return;
}

await this.roomsService.createRoomParticipant({
    user: { connect: { id: Number(userId) } },
    room: { connect: { id: Number(roomId) } },
});

client.join(roomId.toString());
client.emit('joinedRoom', { roomId });

// Get room's updated participants
const updatedParticipants = await this.roomsService.getRoomParticipants(Number(roomId));
this.server.to(roomId).emit('roomUpdate', {
    roomId,
    participants: updatedParticipants,
});

// Create a new room when 4 participants have joined the current room
await this.createNextRoomIfNecessary(room, updatedParticipants);

// Update the room's state if it is full
await this.updateRoomStateWhenFull(roomId, updatedParticipants); */
