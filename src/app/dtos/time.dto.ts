import { IsNumber, IsOptional } from 'class-validator'

export class TimeDto {
  @IsNumber()
  @IsOptional()
  timeId: string
}
