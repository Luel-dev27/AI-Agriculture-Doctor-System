export interface AiAnalysisInput {
  imageUrl?: string;
  cropName?: string;
  fileName?: string;
  mimeType?: string;
  fieldNotes?: string;
}

export interface AiAnalysisResult {
  diseaseName: string;
  confidence: number;
  recommendation: string;
  summary: string;
  medicineName: string;
  applicationRate: string;
  preventionPlan: string;
  severity: 'low' | 'medium' | 'high';
  urgency: 'monitor' | 'soon' | 'immediate';
  suspectedConditions: string[];
  nextSteps: string[];
  knowledgeMatches: string[];
  advisorySource: 'knowledge-guided-openai' | 'knowledge-guided-mock';
  provider: 'openai' | 'mock';
  model: string;
}
