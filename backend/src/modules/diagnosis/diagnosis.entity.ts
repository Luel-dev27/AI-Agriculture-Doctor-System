export class DiagnosisEntity {
  id!: number;
  cropId!: number | null;
  cropName!: string;
  imageUrl!: string | null;
  imageName!: string | null;
  diseaseName!: string;
  confidence!: number;
  recommendation!: string;
  summary!: string;
  severity!: 'low' | 'medium' | 'high';
  urgency!: 'monitor' | 'soon' | 'immediate';
  suspectedConditions!: string[];
  nextSteps!: string[];
  provider!: 'openai' | 'mock';
  model!: string;
  createdAt!: Date;
}
