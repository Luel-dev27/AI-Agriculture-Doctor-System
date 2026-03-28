import { Injectable, Logger } from '@nestjs/common';
import { AiAnalysisInput, AiAnalysisResult } from './ai.interface';

@Injectable()
export class AiService {
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
    if (process.env.OPENAI_API_KEY && input.imageBuffer?.length) {
      try {
        return await this.analyzeWithOpenAi(input);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown AI provider error';
        this.logger.warn(
          `OpenAI analysis failed, falling back to mock analysis: ${message}`,
        );
      }
    }

    return this.analyzeWithMock(input);
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

  private analyzeWithMock(input: AiAnalysisInput): AiAnalysisResult {
    const identifier =
      `${input.fileName ?? ''} ${input.imageUrl ?? ''}`.toLowerCase();
    const cropName = input.cropName?.trim() || 'crop';
    const profile = this.getCropProfile(cropName);

    if (identifier.includes('healthy')) {
      return {
        diseaseName: 'Healthy crop',
        confidence: 94,
        recommendation: `No visible disease pattern detected for this ${cropName}. Continue routine monitoring and keep irrigation and nutrition balanced.`,
        summary:
          'The image cues suggest healthy foliage with no strong disease signature.',
        severity: 'low',
        urgency: 'monitor',
        suspectedConditions: ['No strong disease signal'],
        nextSteps: [
          'Keep weekly image records for comparison',
          'Maintain balanced irrigation and nutrient schedule',
          'Recheck if discoloration or lesions begin to spread',
        ],
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
        severity: 'medium',
        urgency: 'soon',
        suspectedConditions: ['Leaf rust', ...profile.watchFor.slice(0, 2)],
        nextSteps: [
          'Inspect nearby plants for spreading lesions',
          'Reduce prolonged leaf wetness where possible',
          'Confirm crop-specific treatment with a local agronomist',
        ],
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
        severity: 'high',
        urgency: 'immediate',
        suspectedConditions: ['Leaf blight', ...profile.watchFor.slice(0, 2)],
        nextSteps: [
          'Separate severely affected plants or leaves immediately',
          'Inspect the full bed or field for similar collapse patterns',
          'Escalate to expert review if spread is increasing quickly',
        ],
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
      severity: 'medium',
      urgency: 'soon',
      suspectedConditions: profile.watchFor,
      nextSteps: [
        ...profile.guidance,
        'Capture another image from a closer angle in natural light',
      ],
      provider: 'mock',
      model: 'local-rules',
    };
  }

  private async analyzeWithOpenAi(
    input: AiAnalysisInput & { imageBuffer?: Buffer },
  ): Promise<AiAnalysisResult> {
    const cropName = input.cropName?.trim() || 'crop';
    const mimeType = input.mimeType || 'image/jpeg';
    const base64Image = input.imageBuffer?.toString('base64');
    const profile = this.getCropProfile(cropName);

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
              'You are an agricultural plant disease triage assistant. Analyze the crop image and respond in JSON only. Return keys diseaseName, confidence, recommendation, summary, severity, urgency, suspectedConditions, nextSteps. confidence must be an integer from 0 to 100. severity must be one of low, medium, high. urgency must be one of monitor, soon, immediate. suspectedConditions and nextSteps must be arrays of short strings. If uncertain, say Needs expert review.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Analyze this ${cropName} image for visible disease symptoms. Focus on practical farmer guidance and avoid overclaiming certainty.`,
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
      provider: 'openai' as const,
      model: this.defaultModel,
    };

    if (!this.isTrustedOpenAiResult(normalized)) {
      this.logger.warn(
        `OpenAI result was too uncertain for direct use (confidence=${normalized.confidence}, disease="${normalized.diseaseName}").`,
      );
      return this.buildExpertReviewResult(cropName, profile, 'openai');
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
  ): AiAnalysisResult {
    return {
      diseaseName: 'Needs expert review',
      confidence: 58,
      recommendation: `The current AI analysis for this ${cropName} is too uncertain to trust directly. Keep the image, record field observations, and seek expert review if symptoms persist or spread.`,
      summary:
        'The system captured the case, but the diagnosis confidence was too low or incomplete for a dependable disease label.',
      severity: 'medium',
      urgency: 'soon',
      suspectedConditions: profile.watchFor,
      nextSteps: [
        ...profile.guidance,
        'Capture another close-up image in natural light',
      ],
      provider,
      model: this.defaultModel,
    };
  }
}
