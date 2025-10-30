import { IsBoolean } from 'class-validator';

export class CompleteSubtaskDto {
  @IsBoolean()
  completed?: boolean;
}
