import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateDiagnosisDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999999)
  cropId?: number;

  @IsString()
  @Length(2, 80)
  cropName!: string;

  @IsOptional()
  @IsString()
  @Length(3, 500)
  imageUrl?: string;
}
