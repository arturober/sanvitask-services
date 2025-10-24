import type { Ref } from '@mikro-orm/core';
import {
  IsDateString,
  IsEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { User } from 'src/users/entities/user.entity';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  description?: string;

  @IsDateString(
    { strict: true },
    { message: 'deadLine must be a valid ISO 8601 date string' },
  )
  deadLine?: Date;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  filepath?: string;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;

  @IsEmpty()
  creator: Ref<User>;

  @IsEmpty()
  position: number;
}
