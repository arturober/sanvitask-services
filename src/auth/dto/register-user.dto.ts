import {
  IsString,
  IsEmail,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsBase64,
} from 'class-validator';
import { Transform } from 'class-transformer';
import * as crypto from 'crypto';
import { IsUserAlreadyExist } from '../validators/user-exists.validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsEmail()
  @IsNotEmpty()
  @IsUserAlreadyExist({
    message: 'Email $value is already present in the database',
  })
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @Transform((p) =>
    p.value && typeof p.value === 'string'
      ? crypto.createHash('sha256').update(p.value, 'utf-8').digest('base64')
      : (p.value as string),
  )
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  @Transform((v) =>
    typeof v.value === 'string'
      ? v.value.split(',')[1] || v.value
      : (v.value as string),
  )
  avatar: string;

  @IsNumber()
  @IsOptional()
  lat = 0;

  @IsNumber()
  @IsOptional()
  lng = 0;

  @IsString()
  @IsOptional()
  readonly firebaseToken: string;
}
