import { IsBoolean, IsString } from 'class-validator';

export class UpdateSubtaskDto {
  @IsString()
  description?: string;

  @IsBoolean()
  completed?: boolean;
}
