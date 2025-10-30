import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateTaskPostionStatusDto {
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsOptional()
  @Min(0)
  @Max(2)
  status?: number;

  @IsNumber({ maxDecimalPlaces: 0 })
  @IsOptional()
  @Min(1)
  position?: number;
}
