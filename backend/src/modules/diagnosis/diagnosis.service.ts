import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { UploadService } from '../upload/upload.service';
import { DiagnosisEntity } from './diagnosis.entity';
import { DiagnosisRepository } from './diagnosis.repository';

@Injectable()
export class DiagnosisService {
  constructor(
    private readonly aiService: AiService,
    private readonly diagnosisRepository: DiagnosisRepository,
    private readonly uploadService: UploadService,
  ) {}

  async create(payload: {
    userId?: number;
    userName?: string;
    userEmail?: string;
    cropId?: number;
    cropName?: string;
    imageUrl?: string;
    imageName?: string;
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
      imageBuffer: payload.imageBuffer,
    });

    const diagnosis: DiagnosisEntity = {
      id: Date.now(),
      userId: payload.userId ?? 0,
      userName: payload.userName?.trim() || 'Unknown user',
      userEmail: payload.userEmail?.trim() || 'unknown@example.com',
      cropId: payload.cropId ?? null,
      cropName: payload.cropName?.trim() || 'Unknown crop',
      imageUrl: imageUrl ?? null,
      imageName: imageName ?? null,
      diseaseName: analysis.diseaseName,
      confidence: analysis.confidence,
      recommendation: analysis.recommendation,
      summary: analysis.summary,
      severity: analysis.severity,
      urgency: analysis.urgency,
      suspectedConditions: analysis.suspectedConditions,
      nextSteps: analysis.nextSteps,
      provider: analysis.provider,
      model: analysis.model,
      createdAt: new Date(),
    };

    return this.diagnosisRepository.save(diagnosis);
  }

  history(userId?: number) {
    return this.diagnosisRepository.findAll(userId);
  }
}
