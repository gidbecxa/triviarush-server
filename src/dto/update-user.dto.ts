import { IsString, IsEmail, IsOptional, IsJSON } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  readonly username?: string;

  @IsEmail()
  @IsOptional()
  readonly email?: string;

  @IsString()
  @IsOptional()
  readonly phoneNumber?: string;

  @IsJSON()
  @IsOptional()
  readonly topics?: object;

  @IsString()
  @IsOptional()
  readonly bio?: string;

  @IsString()
  @IsOptional()
  readonly avatar?: string;

  @IsJSON()
  @IsOptional()
  readonly location?: object;
}