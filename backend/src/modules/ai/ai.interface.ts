export interface AiAnalysisInput {
  imageUrl?: string;
  cropName?: string;
  fileName?: string;
  mimeType?: string;
}

export interface AiAnalysisResult {
  diseaseName: string;
  confidence: number;
  recommendation: string;
  summary: string;
  severity: 'low' | 'medium' | 'high';
  urgency: 'monitor' | 'soon' | 'immediate';
  suspectedConditions: string[];
  nextSteps: string[];
  provider: 'openai' | 'mock';
  model: string;
}
