import { IsNotEmpty, IsString } from 'class-validator';

export class AddSubtaskDto {
  @IsString()
  @IsNotEmpty()
  description!: string;
}
