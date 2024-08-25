import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TopicsEnum, RoomState } from '@prisma/client';

export class CreateRoomDto {
  @IsString()
  title: string;

  @IsEnum(TopicsEnum)
  category: TopicsEnum;

  @IsEnum(RoomState)
  @IsOptional()
  state?: RoomState;
}
