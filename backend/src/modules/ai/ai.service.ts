import { Injectable, Logger } from '@nestjs/common';
import { AiAnalysisInput, AiAnalysisResult } from './ai.interface';
import { KnowledgeService } from '../knowledge/knowledge.service';
import {
  KnowledgeEntryEntity,
  RankedKnowledgeEntry,
} from '../knowledge/knowledge.entity';

@Injectable()
export class AiService {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  private readonly logger = new Logger(AiService.name);
  private readonly defaultModel = process.env.OPENAI_MODEL || 'gpt-5-mini';
  private static readonly MIN_TRUSTED_CONFIDENCE = 70;
  private static readonly UNCERTAIN_DISEASE_NAMES = new Set([
    'needs expert review',
    'unknown',
    'uncertain',
    'inconclusive',
    'not sure',
  ]);

  async analyze(
    input: AiAnalysisInput & { imageBuffer?: Buffer },
  ): Promise<AiAnalysisResult> {
    const rankedKnowledgeEntries = await this.knowledgeService.findCandidateEntries({
      cropName: input.cropName,
      fieldNotes: input.fieldNotes,
      fileName: input.fileName,
      imageUrl: input.imageUrl,
      limit: 3,
      minScore: 2,
    });
    const cropKnowledgeEntries = await this.knowledgeService.findAllForCrop(
      input.cropName,
    );

    if (process.env.OPENAI_API_KEY && input.imageBuffer?.length) {
      try {
        return await this.analyzeWithOpenAi(
          input,
          cropKnowledgeEntries,
          rankedKnowledgeEntries,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown AI provider error';
        this.logger.warn(
          `OpenAI analysis failed, falling back to mock analysis: ${message}`,
        );
      }
    }

    return this.analyzeWithMock(input, rankedKnowledgeEntries);
  }

  getStatus() {
    return {
      configured: Boolean(process.env.OPENAI_API_KEY),
      provider: process.env.OPENAI_API_KEY ? 'openai' : 'mock',
      model: this.defaultModel,
    };
  }

  private readonly cropProfiles: Record<
    string,
    { watchFor: string[]; guidance: string[] }
  > = {
    tomato: {
      watchFor: ['early blight', 'late blight', 'leaf spot'],
      guidance: [
        'Check lower leaves first',
        'Limit overhead irrigation',
        'Remove heavily damaged foliage',
      ],
    },
    maize: {
      watchFor: ['rust', 'leaf blight', 'nutrient stress'],
      guidance: [
        'Inspect upper canopy spread',
        'Compare lesions across neighboring plants',
        'Track spread after rainfall',
      ],
    },
    wheat: {
      watchFor: ['rust', 'powdery mildew', 'septoria'],
      guidance: [
        'Inspect stripe patterns',
        'Check whether lesions are moving leaf-to-leaf',
        'Review airflow and moisture conditions',
      ],
    },
    potato: {
      watchFor: ['late blight', 'early blight', 'leaf curl stress'],
      guidance: [
        'Look for water-soaked lesions',
        'Separate rapidly collapsing plants',
        'Inspect stems together with leaves',
      ],
    },
    coffee: {
      watchFor: ['coffee leaf rust', 'leaf spot', 'nutrient imbalance'],
      guidance: [
        'Inspect orange powder under leaves',
        'Check shade and humidity conditions',
        'Flag spread across branches',
      ],
    },
  };

  private analyzeWithMock(
    input: AiAnalysisInput,
    knowledgeEntries: RankedKnowledgeEntry[],
  ): AiAnalysisResult {
    const identifier =
      `${input.fileName ?? ''} ${input.imageUrl ?? ''} ${input.fieldNotes ?? ''}`.toLowerCase();
    const cropName = input.cropName?.trim() || 'crop';
    const profile = this.getCropProfile(cropName);
    const primaryKnowledge = knowledgeEntries[0];

    if (identifier.includes('healthy')) {
      return {
        diseaseName: 'Healthy crop',
        confidence: 94,
        recommendation: `No visible disease pattern detected for this ${cropName}. Continue routine monitoring and keep irrigation and nutrition balanced.`,
        summary:
          'The image cues suggest healthy foliage with no strong disease signature.',
        medicineName: 'No immediate pesticide recommended',
        applicationRate: 'Continue monitoring and confirm any treatment only if symptoms appear.',
        preventionPlan:
          'Maintain balanced irrigation, field hygiene, and regular scouting records.',
        severity: 'low',
        urgency: 'monitor',
        suspectedConditions: ['No strong disease signal'],
        nextSteps: [
          'Keep weekly image records for comparison',
          'Maintain balanced irrigation and nutrient schedule',
          'Recheck if discoloration or lesions begin to spread',
        ],
        knowledgeMatches: [],
        advisorySource: 'knowledge-guided-mock',
        provider: 'mock',
        model: 'local-rules',
      };
    }

    if (primaryKnowledge) {
      const confidenceBoost = Math.min(18, knowledgeEntries.length * 4);
      return {
        diseaseName: primaryKnowledge.diseaseName,
        confidence: Math.max(72, 68 + confidenceBoost),
        recommendation: `${primaryKnowledge.treatmentPlan} Recommended medicine: ${primaryKnowledge.medicineName}.`,
        summary: `The system matched this ${cropName} case to the internal agriculture knowledge base using crop context, image metadata, and symptom hints.`,
        medicineName: primaryKnowledge.medicineName,
        applicationRate: primaryKnowledge.applicationRate,
        preventionPlan: primaryKnowledge.preventionPlan,
        severity: primaryKnowledge.severity,
        urgency: primaryKnowledge.severity === 'high' ? 'immediate' : 'soon',
        suspectedConditions: knowledgeEntries.map((entry) => entry.diseaseName),
        nextSteps: [
          primaryKnowledge.treatmentPlan,
          primaryKnowledge.applicationRate,
          'Request agronomist confirmation if symptoms differ from the suggested knowledge match',
        ],
        knowledgeMatches: knowledgeEntries.map((entry) =>
          this.formatKnowledgeMatch(entry),
        ),
        advisorySource: 'knowledge-guided-mock',
        provider: 'mock',
        model: 'local-rules',
      };
    }

    if (identifier.includes('rust')) {
      return {
        diseaseName: 'Leaf rust',
        confidence: 88,
        recommendation: `Rust-like symptoms may be present on the ${cropName}. Isolate affected leaves, improve airflow, and prepare a crop-specific fungicide plan with a local agronomist.`,
        summary:
          'The current pattern resembles rust lesions or powdery spread on leaf surfaces.',
        medicineName: 'Confirm crop-specific fungicide with expert review',
        applicationRate: 'Use only after local agronomy confirmation.',
        preventionPlan:
          'Reduce leaf wetness, improve airflow, and keep scouting nearby plants.',
        severity: 'medium',
        urgency: 'soon',
        suspectedConditions: ['Leaf rust', ...profile.watchFor.slice(0, 2)],
        nextSteps: [
          'Inspect nearby plants for spreading lesions',
          'Reduce prolonged leaf wetness where possible',
          'Confirm crop-specific treatment with a local agronomist',
        ],
        knowledgeMatches: [],
        advisorySource: 'knowledge-guided-mock',
        provider: 'mock',
        model: 'local-rules',
      };
    }

    if (identifier.includes('blight')) {
      return {
        diseaseName: 'Leaf blight',
        confidence: 86,
        recommendation: `Possible blight symptoms detected on the ${cropName}. Remove heavily affected tissue, avoid overhead irrigation, and inspect nearby plants for rapid spread.`,
        summary:
          'The image name suggests fast-spreading blight-like damage with tissue stress.',
        medicineName: 'Urgent fungicide confirmation required',
        applicationRate: 'Confirm label guidance locally before use.',
        preventionPlan:
          'Isolate affected areas, reduce wet foliage conditions, and inspect nearby plants immediately.',
        severity: 'high',
        urgency: 'immediate',
        suspectedConditions: ['Leaf blight', ...profile.watchFor.slice(0, 2)],
        nextSteps: [
          'Separate severely affected plants or leaves immediately',
          'Inspect the full bed or field for similar collapse patterns',
          'Escalate to expert review if spread is increasing quickly',
        ],
        knowledgeMatches: [],
        advisorySource: 'knowledge-guided-mock',
        provider: 'mock',
        model: 'local-rules',
      };
    }

    if (identifier.includes('spot') || identifier.includes('mildew')) {
      return {
        diseaseName: 'Leaf spot / mildew suspicion',
        confidence: 79,
        recommendation: `There may be early fungal symptoms on the ${cropName}. Reduce leaf wetness duration, improve spacing, and observe whether spotting expands over the next few days.`,
        summary:
          'The available signal points to a mild fungal issue, but confidence is moderate.',
        medicineName: 'Preventive fungicide review recommended',
        applicationRate: 'Apply only under local guidance if lesions continue spreading.',
        preventionPlan:
          'Improve spacing, reduce wet foliage time, and capture another close image after 48 to 72 hours.',
        severity: 'medium',
        urgency: 'soon',
        suspectedConditions: [
          'Leaf spot',
          'Mildew suspicion',
          ...profile.watchFor.slice(0, 1),
        ],
        nextSteps: [
          'Compare new lesions over the next 48 to 72 hours',
          'Improve spacing or airflow if canopy is dense',
          'Collect another close-up image if the pattern expands',
        ],
        knowledgeMatches: [],
        advisorySource: 'knowledge-guided-mock',
        provider: 'mock',
        model: 'local-rules',
      };
    }

    return {
      diseaseName: 'Needs expert review',
      confidence: 63,
      recommendation: `The current AI pipeline captured the case, but the disease pattern is not specific enough yet. Keep the image, add field notes, and request expert review if symptoms worsen.`,
      summary:
        'A diagnosis record was created, but the current mock AI provider could not map the image to a confident disease class.',
      medicineName: 'Expert review required',
      applicationRate: 'Do not apply treatment until the disease class is confirmed.',
      preventionPlan:
        'Capture more images, keep the field under observation, and record symptom spread.',
      severity: 'medium',
      urgency: 'soon',
      suspectedConditions: profile.watchFor,
      nextSteps: [
        ...profile.guidance,
        'Capture another image from a closer angle in natural light',
      ],
      knowledgeMatches: knowledgeEntries.map((entry) =>
        this.formatKnowledgeMatch(entry),
      ),
      advisorySource: 'knowledge-guided-mock',
      provider: 'mock',
      model: 'local-rules',
    };
  }

  private async analyzeWithOpenAi(
    input: AiAnalysisInput & { imageBuffer?: Buffer },
    cropKnowledgeEntries: KnowledgeEntryEntity[],
    rankedKnowledgeEntries: RankedKnowledgeEntry[],
  ): Promise<AiAnalysisResult> {
    const cropName = input.cropName?.trim() || 'crop';
    const mimeType = input.mimeType || 'image/jpeg';
    const base64Image = input.imageBuffer?.toString('base64');
    const profile = this.getCropProfile(cropName);
    const knowledgeContext = this.buildKnowledgeContext(
      rankedKnowledgeEntries.length > 0 ? rankedKnowledgeEntries : cropKnowledgeEntries,
    );

    if (!base64Image) {
      throw new Error('Missing image data for OpenAI analysis.');
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.defaultModel,
        input: [
          {
            role: 'system',
            content:
              'You are an agricultural plant disease triage assistant. Use the provided crop-specific knowledge base as the primary source for disease names, medicine suggestions, prevention guidance, and treatment planning. Analyze the crop image and respond in JSON only. Return keys diseaseName, confidence, recommendation, summary, medicineName, applicationRate, preventionPlan, severity, urgency, suspectedConditions, nextSteps, knowledgeMatches. confidence must be an integer from 0 to 100. severity must be one of low, medium, high. urgency must be one of monitor, soon, immediate. suspectedConditions, nextSteps, and knowledgeMatches must be arrays of short strings. Only recommend medicine that appears in the supplied knowledge base. If uncertain, say Needs expert review.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Analyze this ${cropName} image for visible disease symptoms. Field notes: ${input.fieldNotes || 'none provided'}. Focus on practical farmer guidance, avoid overclaiming certainty, and ground the answer in this knowledge base:\n${knowledgeContext}`,
              },
              {
                type: 'input_image',
                image_url: `data:${mimeType};base64,${base64Image}`,
                detail: 'low',
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_object',
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI API request failed: ${response.status} ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };

    const rawText =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content ?? [])
        .find(
          (item) =>
            item.type === 'output_text' && typeof item.text === 'string',
        )?.text;

    if (!rawText) {
      throw new Error('OpenAI response did not include parseable output text.');
    }

    const parsed = this.extractJsonObject(rawText) as Partial<AiAnalysisResult>;
    const normalized = {
      diseaseName: parsed.diseaseName?.trim() || 'Needs expert review',
      confidence: this.normalizeConfidence(parsed.confidence),
      recommendation:
        parsed.recommendation?.trim() ||
        'The image was analyzed, but the recommendation was incomplete. Review the crop manually.',
      summary:
        parsed.summary?.trim() ||
        'The image was processed by OpenAI vision analysis.',
      medicineName:
        parsed.medicineName?.trim() || 'Expert review required',
      applicationRate:
        parsed.applicationRate?.trim() ||
        'Confirm local dosage before application.',
      preventionPlan:
        parsed.preventionPlan?.trim() ||
        'Keep field notes, monitor spread, and capture follow-up images.',
      severity: this.normalizeSeverity(parsed.severity),
      urgency: this.normalizeUrgency(parsed.urgency),
      suspectedConditions: this.normalizeStringArray(
        parsed.suspectedConditions,
        ['Needs expert review'],
      ),
      nextSteps: this.normalizeStringArray(parsed.nextSteps, [
        'Inspect the crop manually',
        'Capture another clear image',
        'Consult local agronomy support if spread is increasing',
      ]),
      knowledgeMatches: this.normalizeStringArray(
        parsed.knowledgeMatches,
        (rankedKnowledgeEntries.length > 0
          ? rankedKnowledgeEntries
          : cropKnowledgeEntries
        ).map((entry) => this.formatKnowledgeMatch(entry)),
      ),
      advisorySource: 'knowledge-guided-openai' as const,
      provider: 'openai' as const,
      model: this.defaultModel,
    };

    const bestKnowledgeMatch = await this.knowledgeService.findBestMatchByDiseaseName({
      cropName,
      diseaseName: normalized.diseaseName,
    });

    if (bestKnowledgeMatch) {
      normalized.medicineName = bestKnowledgeMatch.medicineName;
      normalized.applicationRate = bestKnowledgeMatch.applicationRate;
      normalized.preventionPlan = bestKnowledgeMatch.preventionPlan;
      normalized.knowledgeMatches = Array.from(
        new Set([
          this.formatKnowledgeMatch(bestKnowledgeMatch),
          ...normalized.knowledgeMatches,
        ]),
      );
      normalized.recommendation = `${bestKnowledgeMatch.treatmentPlan} Recommended medicine: ${bestKnowledgeMatch.medicineName}.`;
      normalized.nextSteps = this.normalizeStringArray(normalized.nextSteps, [
        bestKnowledgeMatch.treatmentPlan,
        bestKnowledgeMatch.applicationRate,
      ]);
    }

    if (!this.isTrustedOpenAiResult(normalized)) {
      this.logger.warn(
        `OpenAI result was too uncertain for direct use (confidence=${normalized.confidence}, disease="${normalized.diseaseName}").`,
      );
      return this.buildExpertReviewResult(
        cropName,
        profile,
        'openai',
        rankedKnowledgeEntries,
      );
    }

    return normalized;
  }

  private normalizeConfidence(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(100, Math.round(value)));
    }

    return 0;
  }

  private normalizeSeverity(value: unknown): 'low' | 'medium' | 'high' {
    if (value === 'low' || value === 'medium' || value === 'high') {
      return value;
    }

    return 'medium';
  }

  private normalizeUrgency(value: unknown): 'monitor' | 'soon' | 'immediate' {
    if (value === 'monitor' || value === 'soon' || value === 'immediate') {
      return value;
    }

    return 'soon';
  }

  private normalizeStringArray(value: unknown, fallback: string[]): string[] {
    if (Array.isArray(value)) {
      const items = value
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);

      if (items.length > 0) {
        return items.slice(0, 5);
      }
    }

    return fallback;
  }

  private isTrustedOpenAiResult(result: AiAnalysisResult): boolean {
    const normalizedDiseaseName = result.diseaseName.trim().toLowerCase();

    if (
      !normalizedDiseaseName ||
      AiService.UNCERTAIN_DISEASE_NAMES.has(normalizedDiseaseName)
    ) {
      return false;
    }

    if (result.confidence < AiService.MIN_TRUSTED_CONFIDENCE) {
      return false;
    }

    if (
      !result.recommendation.trim() ||
      !result.summary.trim() ||
      !result.medicineName.trim() ||
      !result.applicationRate.trim() ||
      !result.preventionPlan.trim() ||
      result.suspectedConditions.length === 0 ||
      result.nextSteps.length === 0
    ) {
      return false;
    }

    return true;
  }

  private extractJsonObject(rawText: string): unknown {
    try {
      return JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);

      if (!match) {
        throw new Error('Unable to extract JSON object from model response.');
      }

      return JSON.parse(match[0]);
    }
  }

  private getCropProfile(cropName: string) {
    const key = cropName.trim().toLowerCase();
    return (
      this.cropProfiles[key] || {
        watchFor: ['leaf spot', 'blight', 'rust'],
        guidance: [
          'Inspect nearby leaves and stems',
          'Note whether damage is spreading rapidly',
          'Capture additional photos from multiple angles',
        ],
      }
    );
  }

  private buildExpertReviewResult(
    cropName: string,
    profile: { watchFor: string[]; guidance: string[] },
    provider: AiAnalysisResult['provider'],
    knowledgeEntries: KnowledgeEntryEntity[],
  ): AiAnalysisResult {
    return {
      diseaseName: 'Needs expert review',
      confidence: 58,
      recommendation: `The current AI analysis for this ${cropName} is too uncertain to trust directly. Keep the image, record field observations, and seek expert review if symptoms persist or spread.`,
      summary:
        'The system captured the case, but the diagnosis confidence was too low or incomplete for a dependable disease label.',
      medicineName: 'Expert review required',
      applicationRate: 'Wait for agronomist confirmation before applying medicine.',
      preventionPlan:
        'Monitor spread, isolate the worst-affected areas where possible, and capture another close-up image in daylight.',
      severity: 'medium',
      urgency: 'soon',
      suspectedConditions: profile.watchFor,
      nextSteps: [
        ...profile.guidance,
        'Capture another close-up image in natural light',
      ],
      knowledgeMatches: knowledgeEntries.map((entry) =>
        this.formatKnowledgeMatch(entry),
      ),
      advisorySource: provider === 'openai'
        ? 'knowledge-guided-openai'
        : 'knowledge-guided-mock',
      provider,
      model: this.defaultModel,
    };
  }

  private buildKnowledgeContext(entries: KnowledgeEntryEntity[]) {
    if (entries.length === 0) {
      return 'No matching curated knowledge entry was found. If confidence is low, return Needs expert review.';
    }

    return entries
      .map(
        (entry, index) =>
          `${index + 1}. Disease=${entry.diseaseName}; Medicine=${entry.medicineName}; ApplicationRate=${entry.applicationRate}; Treatment=${entry.treatmentPlan}; Prevention=${entry.preventionPlan}; Keywords=${entry.symptomKeywords.join(', ')}; Aliases=${entry.aliases.join(', ')}; Notes=${entry.notes}`,
      )
      .join('\n');
  }

  private formatKnowledgeMatch(entry: {
    cropName: string;
    diseaseName: string;
    matchScore?: number;
  }) {
    return typeof entry.matchScore === 'number'
      ? `${entry.cropName}: ${entry.diseaseName} (score ${entry.matchScore})`
      : `${entry.cropName}: ${entry.diseaseName}`;
  }
}
