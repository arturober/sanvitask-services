import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(RegisterUserDto, ['email']),
) {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;
}
