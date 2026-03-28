import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DiagnosisEntity } from './diagnosis.entity';

@Injectable()
export class DiagnosisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId?: number): Promise<DiagnosisEntity[]> {
    const items = await this.prisma.diagnosis.findMany({
      where: typeof userId === 'number' ? { userId } : undefined,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return items.map((item) => ({
      id: item.id,
      userId: item.userId,
      userName: item.user.name,
      userEmail: item.user.email,
      cropId: item.cropId,
      cropName: item.cropName,
      imageUrl: item.imageUrl,
      imageName: item.imageName,
      diseaseName: item.diseaseName,
      confidence: item.confidence,
      recommendation: item.recommendation,
      summary: item.summary,
      severity: item.severity as DiagnosisEntity['severity'],
      urgency: item.urgency as DiagnosisEntity['urgency'],
      suspectedConditions: this.asStringArray(item.suspectedConditions),
      nextSteps: this.asStringArray(item.nextSteps),
      provider: item.provider as DiagnosisEntity['provider'],
      model: item.model,
      createdAt: item.createdAt,
    }));
  }

  async save(diagnosis: DiagnosisEntity): Promise<DiagnosisEntity> {
    const created = await this.prisma.diagnosis.create({
      data: {
        userId: diagnosis.userId,
        cropId: diagnosis.cropId,
        cropName: diagnosis.cropName,
        imageUrl: diagnosis.imageUrl,
        imageName: diagnosis.imageName,
        diseaseName: diagnosis.diseaseName,
        confidence: diagnosis.confidence,
        recommendation: diagnosis.recommendation,
        summary: diagnosis.summary,
        severity: diagnosis.severity,
        urgency: diagnosis.urgency,
        suspectedConditions: JSON.stringify(diagnosis.suspectedConditions),
        nextSteps: JSON.stringify(diagnosis.nextSteps),
        provider: diagnosis.provider,
        model: diagnosis.model,
        createdAt: diagnosis.createdAt,
      },
      include: {
        user: true,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      userName: created.user.name,
      userEmail: created.user.email,
      cropId: created.cropId,
      cropName: created.cropName,
      imageUrl: created.imageUrl,
      imageName: created.imageName,
      diseaseName: created.diseaseName,
      confidence: created.confidence,
      recommendation: created.recommendation,
      summary: created.summary,
      severity: created.severity as DiagnosisEntity['severity'],
      urgency: created.urgency as DiagnosisEntity['urgency'],
      suspectedConditions: this.asStringArray(created.suspectedConditions),
      nextSteps: this.asStringArray(created.nextSteps),
      provider: created.provider as DiagnosisEntity['provider'],
      model: created.model,
      createdAt: created.createdAt,
    };
  }

  private asStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }

    if (typeof value !== 'string') {
      return [];
    }

    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  }
}
