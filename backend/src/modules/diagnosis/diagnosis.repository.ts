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
      fieldNotes: item.fieldNotes,
      diseaseName: item.diseaseName,
      confidence: item.confidence,
      recommendation: item.recommendation,
      summary: item.summary,
      medicineName: item.medicineName,
      applicationRate: item.applicationRate,
      preventionPlan: item.preventionPlan,
      severity: item.severity as DiagnosisEntity['severity'],
      urgency: item.urgency as DiagnosisEntity['urgency'],
      suspectedConditions: this.asStringArray(item.suspectedConditions),
      nextSteps: this.asStringArray(item.nextSteps),
      knowledgeMatches: this.asStringArray(item.knowledgeMatches),
      advisorySource: item.advisorySource as DiagnosisEntity['advisorySource'],
      reviewStatus: item.reviewStatus as DiagnosisEntity['reviewStatus'],
      reviewedByName: item.reviewedByName,
      reviewNotes: item.reviewNotes,
      reviewedAt: item.reviewedAt,
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
        fieldNotes: diagnosis.fieldNotes,
        diseaseName: diagnosis.diseaseName,
        confidence: diagnosis.confidence,
        recommendation: diagnosis.recommendation,
        summary: diagnosis.summary,
        medicineName: diagnosis.medicineName,
        applicationRate: diagnosis.applicationRate,
        preventionPlan: diagnosis.preventionPlan,
        severity: diagnosis.severity,
        urgency: diagnosis.urgency,
        suspectedConditions: JSON.stringify(diagnosis.suspectedConditions),
        nextSteps: JSON.stringify(diagnosis.nextSteps),
        knowledgeMatches: JSON.stringify(diagnosis.knowledgeMatches),
        advisorySource: diagnosis.advisorySource,
        reviewStatus: diagnosis.reviewStatus,
        reviewedByName: diagnosis.reviewedByName,
        reviewNotes: diagnosis.reviewNotes,
        reviewedAt: diagnosis.reviewedAt,
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
      fieldNotes: created.fieldNotes,
      diseaseName: created.diseaseName,
      confidence: created.confidence,
      recommendation: created.recommendation,
      summary: created.summary,
      medicineName: created.medicineName,
      applicationRate: created.applicationRate,
      preventionPlan: created.preventionPlan,
      severity: created.severity as DiagnosisEntity['severity'],
      urgency: created.urgency as DiagnosisEntity['urgency'],
      suspectedConditions: this.asStringArray(created.suspectedConditions),
      nextSteps: this.asStringArray(created.nextSteps),
      knowledgeMatches: this.asStringArray(created.knowledgeMatches),
      advisorySource: created.advisorySource as DiagnosisEntity['advisorySource'],
      reviewStatus: created.reviewStatus as DiagnosisEntity['reviewStatus'],
      reviewedByName: created.reviewedByName,
      reviewNotes: created.reviewNotes,
      reviewedAt: created.reviewedAt,
      provider: created.provider as DiagnosisEntity['provider'],
      model: created.model,
      createdAt: created.createdAt,
    };
  }

  async findById(id: number): Promise<DiagnosisEntity | undefined> {
    const item = await this.prisma.diagnosis.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!item) {
      return undefined;
    }

    return {
      id: item.id,
      userId: item.userId,
      userName: item.user.name,
      userEmail: item.user.email,
      cropId: item.cropId,
      cropName: item.cropName,
      imageUrl: item.imageUrl,
      imageName: item.imageName,
      fieldNotes: item.fieldNotes,
      diseaseName: item.diseaseName,
      confidence: item.confidence,
      recommendation: item.recommendation,
      summary: item.summary,
      medicineName: item.medicineName,
      applicationRate: item.applicationRate,
      preventionPlan: item.preventionPlan,
      severity: item.severity as DiagnosisEntity['severity'],
      urgency: item.urgency as DiagnosisEntity['urgency'],
      suspectedConditions: this.asStringArray(item.suspectedConditions),
      nextSteps: this.asStringArray(item.nextSteps),
      knowledgeMatches: this.asStringArray(item.knowledgeMatches),
      advisorySource: item.advisorySource as DiagnosisEntity['advisorySource'],
      reviewStatus: item.reviewStatus as DiagnosisEntity['reviewStatus'],
      reviewedByName: item.reviewedByName,
      reviewNotes: item.reviewNotes,
      reviewedAt: item.reviewedAt,
      provider: item.provider as DiagnosisEntity['provider'],
      model: item.model,
      createdAt: item.createdAt,
    };
  }

  async review(input: {
    diagnosisId: number;
    reviewerId: number;
    reviewerName: string;
    resolution: 'confirmed' | 'corrected' | 'escalated';
    confirmedDiseaseName?: string;
    medicineName?: string;
    applicationRate?: string;
    notes: string;
  }): Promise<DiagnosisEntity> {
    const [updated] = await this.prisma.$transaction([
      this.prisma.diagnosis.update({
        where: {
          id: input.diagnosisId,
        },
        data: {
          diseaseName: input.confirmedDiseaseName || undefined,
          medicineName: input.medicineName || undefined,
          applicationRate: input.applicationRate || undefined,
          reviewStatus:
            input.resolution === 'escalated' ? 'escalated' : 'reviewed',
          reviewedByName: input.reviewerName,
          reviewNotes: input.notes,
          reviewedAt: new Date(),
        },
        include: {
          user: true,
        },
      }),
      this.prisma.diagnosisFeedback.create({
        data: {
          diagnosisId: input.diagnosisId,
          reviewerId: input.reviewerId,
          resolution: input.resolution,
          confirmedDiseaseName: input.confirmedDiseaseName,
          medicineName: input.medicineName,
          applicationRate: input.applicationRate,
          notes: input.notes,
        },
      }),
    ]);

    return {
      id: updated.id,
      userId: updated.userId,
      userName: updated.user.name,
      userEmail: updated.user.email,
      cropId: updated.cropId,
      cropName: updated.cropName,
      imageUrl: updated.imageUrl,
      imageName: updated.imageName,
      fieldNotes: updated.fieldNotes,
      diseaseName: updated.diseaseName,
      confidence: updated.confidence,
      recommendation: updated.recommendation,
      summary: updated.summary,
      medicineName: updated.medicineName,
      applicationRate: updated.applicationRate,
      preventionPlan: updated.preventionPlan,
      severity: updated.severity as DiagnosisEntity['severity'],
      urgency: updated.urgency as DiagnosisEntity['urgency'],
      suspectedConditions: this.asStringArray(updated.suspectedConditions),
      nextSteps: this.asStringArray(updated.nextSteps),
      knowledgeMatches: this.asStringArray(updated.knowledgeMatches),
      advisorySource: updated.advisorySource as DiagnosisEntity['advisorySource'],
      reviewStatus: updated.reviewStatus as DiagnosisEntity['reviewStatus'],
      reviewedByName: updated.reviewedByName,
      reviewNotes: updated.reviewNotes,
      reviewedAt: updated.reviewedAt,
      provider: updated.provider as DiagnosisEntity['provider'],
      model: updated.model,
      createdAt: updated.createdAt,
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
