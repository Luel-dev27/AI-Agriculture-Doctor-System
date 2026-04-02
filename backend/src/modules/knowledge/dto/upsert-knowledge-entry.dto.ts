import { IsIn, IsString, Length } from 'class-validator';

export class UpsertKnowledgeEntryDto {
  @IsString()
  @Length(2, 80)
  cropName!: string;

  @IsString()
  @Length(2, 120)
  diseaseName!: string;

  @IsString()
  @Length(2, 400)
  aliases!: string;

  @IsString()
  @Length(2, 400)
  symptomKeywords!: string;

  @IsString()
  @Length(2, 120)
  medicineName!: string;

  @IsString()
  @Length(2, 240)
  applicationRate!: string;

  @IsString()
  @Length(10, 800)
  treatmentPlan!: string;

  @IsString()
  @Length(10, 800)
  preventionPlan!: string;

  @IsIn(['low', 'medium', 'high'])
  severity!: 'low' | 'medium' | 'high';

  @IsString()
  @Length(4, 800)
  notes!: string;
}
