import { Injectable, NotFoundException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { UploadService } from '../upload/upload.service';
import { DiagnosisEntity } from './diagnosis.entity';
import { DiagnosisRepository } from './diagnosis.repository';

@Injectable()
export class DiagnosisService {
  constructor(
    private readonly aiService: AiService,
    private readonly diagnosisRepository: DiagnosisRepository,
    private readonly uploadService: UploadService,
    private readonly knowledgeService: KnowledgeService,
  ) {}

  async create(payload: {
    userId?: number;
    userName?: string;
    userEmail?: string;
    cropId?: number;
    cropName?: string;
    imageUrl?: string;
    imageName?: string;
    fieldNotes?: string;
    mimeType?: string;
    imageBuffer?: Buffer;
  }) {
    let imageUrl = payload.imageUrl;
    let imageName = payload.imageName;
    let mimeType = payload.mimeType;

    if (payload.imageBuffer?.length) {
      const upload = await this.uploadService.upload({
        buffer: payload.imageBuffer,
        originalname: payload.imageName,
        mimetype: payload.mimeType,
      });

      imageUrl = upload.fileUrl;
      imageName = upload.originalName;
      mimeType = upload.mimeType;
    }

    const analysis = await this.aiService.analyze({
      imageUrl,
      cropName: payload.cropName,
      fileName: imageName,
      mimeType,
      fieldNotes: payload.fieldNotes,
      imageBuffer: payload.imageBuffer,
    });

    const diagnosis: DiagnosisEntity = {
      id: 0,
      userId: payload.userId ?? 0,
      userName: payload.userName?.trim() || 'Unknown user',
      userEmail: payload.userEmail?.trim() || 'unknown@example.com',
      cropId: payload.cropId ?? null,
      cropName: payload.cropName?.trim() || 'Unknown crop',
      imageUrl: imageUrl ?? null,
      imageName: imageName ?? null,
      fieldNotes: payload.fieldNotes?.trim() || null,
      diseaseName: analysis.diseaseName,
      confidence: analysis.confidence,
      recommendation: analysis.recommendation,
      summary: analysis.summary,
      medicineName: analysis.medicineName,
      applicationRate: analysis.applicationRate,
      preventionPlan: analysis.preventionPlan,
      severity: analysis.severity,
      urgency: analysis.urgency,
      suspectedConditions: analysis.suspectedConditions,
      nextSteps: analysis.nextSteps,
      knowledgeMatches: analysis.knowledgeMatches,
      advisorySource: analysis.advisorySource,
      reviewStatus: 'pending',
      reviewedByName: null,
      reviewNotes: null,
      reviewedAt: null,
      provider: analysis.provider,
      model: analysis.model,
      createdAt: new Date(),
    };

    return this.diagnosisRepository.save(diagnosis);
  }

  history(userId?: number) {
    return this.diagnosisRepository.findAll(userId);
  }

  async reviewDiagnosis(input: {
    diagnosisId: number;
    reviewerId: number;
    reviewerName: string;
    resolution: 'confirmed' | 'corrected' | 'escalated';
    confirmedDiseaseName?: string;
    medicineName?: string;
    applicationRate?: string;
    notes: string;
  }) {
    const diagnosis = await this.diagnosisRepository.findById(input.diagnosisId);

    if (!diagnosis) {
      throw new NotFoundException('Diagnosis record was not found.');
    }

    const reviewedDiagnosis = await this.diagnosisRepository.review(input);

    if (input.resolution === 'confirmed' || input.resolution === 'corrected') {
      await this.knowledgeService.mergeFeedbackEntry({
        cropName: reviewedDiagnosis.cropName,
        diseaseName:
          input.confirmedDiseaseName?.trim() || reviewedDiagnosis.diseaseName,
        aliases: diagnosis.suspectedConditions,
        symptomKeywords: this.buildFeedbackKeywords(diagnosis),
        medicineName: input.medicineName?.trim() || reviewedDiagnosis.medicineName,
        applicationRate:
          input.applicationRate?.trim() || reviewedDiagnosis.applicationRate,
        treatmentPlan: reviewedDiagnosis.recommendation,
        preventionPlan: reviewedDiagnosis.preventionPlan,
        severity: reviewedDiagnosis.severity,
        notes: [
          `Auto-updated from ${input.resolution} expert feedback.`,
          input.notes.trim(),
        ].join(' '),
      });
    }

    return reviewedDiagnosis;
  }

  private buildFeedbackKeywords(diagnosis: DiagnosisEntity) {
    const fields = [
      diagnosis.fieldNotes || '',
      diagnosis.summary || '',
      ...diagnosis.suspectedConditions,
      ...diagnosis.knowledgeMatches,
    ]
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 4);

    return Array.from(new Set(fields)).slice(0, 12);
  }
}
