export interface KnowledgeEntryEntity {
  id: number;
  cropName: string;
  diseaseName: string;
  aliases: string[];
  symptomKeywords: string[];
  medicineName: string;
  applicationRate: string;
  treatmentPlan: string;
  preventionPlan: string;
  severity: 'low' | 'medium' | 'high';
  notes: string;
}

export interface RankedKnowledgeEntry extends KnowledgeEntryEntity {
  matchScore: number;
}
