import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class ReviewDiagnosisDto {
  @IsIn(['confirmed', 'corrected', 'escalated'])
  resolution!: 'confirmed' | 'corrected' | 'escalated';

  @IsOptional()
  @IsString()
  @Length(2, 120)
  confirmedDiseaseName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  medicineName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 240)
  applicationRate?: string;

  @IsString()
  @Length(4, 800)
  notes!: string;
}
