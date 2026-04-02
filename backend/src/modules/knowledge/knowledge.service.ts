import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeEntryEntity, RankedKnowledgeEntry } from './knowledge.entity';
import { UpsertKnowledgeEntryDto } from './dto/upsert-knowledge-entry.dto';

type SeedKnowledgeEntry = Omit<KnowledgeEntryEntity, 'id'>;

@Injectable()
export class KnowledgeService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedKnowledgeBase();
  }

  async findCandidateEntries(input: {
    cropName?: string;
    fieldNotes?: string;
    fileName?: string;
    imageUrl?: string;
    limit?: number;
    minScore?: number;
  }): Promise<RankedKnowledgeEntry[]> {
    const cropName = input.cropName?.trim();

    if (!cropName) {
      return [];
    }

    const entries = await this.prisma.knowledgeEntry.findMany({
      where: {
        cropName: {
          equals: cropName,
          mode: 'insensitive',
        },
      },
      orderBy: [{ diseaseName: 'asc' }],
    });

    const combinedSignal = [
      input.fieldNotes,
      input.fileName,
      input.imageUrl,
      input.cropName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return entries
      .map((entry) => {
        const entity = this.toEntity(entry);
        const score = this.scoreEntry(entity, combinedSignal);
        return { ...entity, matchScore: score };
      })
      .filter((item) => item.matchScore >= (input.minScore ?? 2))
      .sort((left, right) => right.matchScore - left.matchScore)
      .slice(0, input.limit ?? 3)
      .map((item) => item);
  }

  async findAllForCrop(cropName?: string) {
    const where = cropName?.trim()
      ? {
          cropName: {
            equals: cropName.trim(),
            mode: 'insensitive' as const,
          },
        }
      : undefined;

    const entries = await this.prisma.knowledgeEntry.findMany({
      where,
      orderBy: [{ cropName: 'asc' }, { diseaseName: 'asc' }],
    });

    return entries.map((entry) => this.toEntity(entry));
  }

  async findBestMatchByDiseaseName(input: {
    cropName?: string;
    diseaseName?: string;
  }) {
    const cropName = input.cropName?.trim();
    const diseaseName = input.diseaseName?.trim().toLowerCase();

    if (!cropName || !diseaseName) {
      return undefined;
    }

    const entries = await this.prisma.knowledgeEntry.findMany({
      where: {
        cropName: {
          equals: cropName,
          mode: 'insensitive',
        },
      },
      orderBy: [{ diseaseName: 'asc' }],
    });

    return entries
      .map((entry) => this.toEntity(entry))
      .find((entry) => {
        const diseaseMatches = entry.diseaseName.toLowerCase() === diseaseName;
        const aliasMatches = entry.aliases.some(
          (alias) => alias.toLowerCase() === diseaseName,
        );

        return diseaseMatches || aliasMatches;
      });
  }

  async upsertManualEntry(input: UpsertKnowledgeEntryDto) {
    const entry = await this.prisma.knowledgeEntry.upsert({
      where: {
        cropName_diseaseName: {
          cropName: input.cropName.trim(),
          diseaseName: input.diseaseName.trim(),
        },
      },
      update: {
        aliases: JSON.stringify(this.csvToList(input.aliases)),
        symptomKeywords: JSON.stringify(this.csvToList(input.symptomKeywords)),
        medicineName: input.medicineName.trim(),
        applicationRate: input.applicationRate.trim(),
        treatmentPlan: input.treatmentPlan.trim(),
        preventionPlan: input.preventionPlan.trim(),
        severity: input.severity,
        notes: input.notes.trim(),
      },
      create: {
        cropName: input.cropName.trim(),
        diseaseName: input.diseaseName.trim(),
        aliases: JSON.stringify(this.csvToList(input.aliases)),
        symptomKeywords: JSON.stringify(this.csvToList(input.symptomKeywords)),
        medicineName: input.medicineName.trim(),
        applicationRate: input.applicationRate.trim(),
        treatmentPlan: input.treatmentPlan.trim(),
        preventionPlan: input.preventionPlan.trim(),
        severity: input.severity,
        notes: input.notes.trim(),
      },
    });

    return this.toEntity(entry);
  }

  async mergeFeedbackEntry(input: {
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
  }) {
    const cropName = input.cropName.trim();
    const diseaseName = input.diseaseName.trim();
    const existing = await this.prisma.knowledgeEntry.findUnique({
      where: {
        cropName_diseaseName: {
          cropName,
          diseaseName,
        },
      },
    });

    const mergedAliases = this.mergeUniqueStrings(
      existing ? this.parseStringArray(existing.aliases) : [],
      input.aliases,
    );
    const mergedKeywords = this.mergeUniqueStrings(
      existing ? this.parseStringArray(existing.symptomKeywords) : [],
      input.symptomKeywords,
    );
    const mergedNotes = existing?.notes
      ? `${existing.notes}\n${input.notes}`.trim()
      : input.notes.trim();

    const entry = await this.prisma.knowledgeEntry.upsert({
      where: {
        cropName_diseaseName: {
          cropName,
          diseaseName,
        },
      },
      update: {
        aliases: JSON.stringify(mergedAliases),
        symptomKeywords: JSON.stringify(mergedKeywords),
        medicineName: input.medicineName.trim(),
        applicationRate: input.applicationRate.trim(),
        treatmentPlan: input.treatmentPlan.trim(),
        preventionPlan: input.preventionPlan.trim(),
        severity: input.severity,
        notes: mergedNotes,
      },
      create: {
        cropName,
        diseaseName,
        aliases: JSON.stringify(mergedAliases),
        symptomKeywords: JSON.stringify(mergedKeywords),
        medicineName: input.medicineName.trim(),
        applicationRate: input.applicationRate.trim(),
        treatmentPlan: input.treatmentPlan.trim(),
        preventionPlan: input.preventionPlan.trim(),
        severity: input.severity,
        notes: mergedNotes,
      },
    });

    return this.toEntity(entry);
  }

  private scoreEntry(entry: KnowledgeEntryEntity, signal: string) {
    let score = 0;

    if (signal.includes(entry.diseaseName.toLowerCase())) {
      score += 5;
    }

    for (const alias of entry.aliases) {
      if (signal.includes(alias.toLowerCase())) {
        score += 4;
      }
    }

    for (const keyword of entry.symptomKeywords) {
      if (signal.includes(keyword.toLowerCase())) {
        score += 3;
      }
    }

    if (signal.includes(entry.cropName.toLowerCase())) {
      score += 1;
    }

    return score;
  }

  private async seedKnowledgeBase() {
    const entries = this.defaultKnowledgeEntries();

    for (const entry of entries) {
      await this.prisma.knowledgeEntry.upsert({
        where: {
          cropName_diseaseName: {
            cropName: entry.cropName,
            diseaseName: entry.diseaseName,
          },
        },
        update: {
          aliases: JSON.stringify(entry.aliases),
          symptomKeywords: JSON.stringify(entry.symptomKeywords),
          medicineName: entry.medicineName,
          applicationRate: entry.applicationRate,
          treatmentPlan: entry.treatmentPlan,
          preventionPlan: entry.preventionPlan,
          severity: entry.severity,
          notes: entry.notes,
        },
        create: {
          cropName: entry.cropName,
          diseaseName: entry.diseaseName,
          aliases: JSON.stringify(entry.aliases),
          symptomKeywords: JSON.stringify(entry.symptomKeywords),
          medicineName: entry.medicineName,
          applicationRate: entry.applicationRate,
          treatmentPlan: entry.treatmentPlan,
          preventionPlan: entry.preventionPlan,
          severity: entry.severity,
          notes: entry.notes,
        },
      });
    }
  }

  private toEntity(entry: {
    id: number;
    cropName: string;
    diseaseName: string;
    aliases: string;
    symptomKeywords: string;
    medicineName: string;
    applicationRate: string;
    treatmentPlan: string;
    preventionPlan: string;
    severity: string;
    notes: string;
  }): KnowledgeEntryEntity {
    return {
      id: entry.id,
      cropName: entry.cropName,
      diseaseName: entry.diseaseName,
      aliases: this.parseStringArray(entry.aliases),
      symptomKeywords: this.parseStringArray(entry.symptomKeywords),
      medicineName: entry.medicineName,
      applicationRate: entry.applicationRate,
      treatmentPlan: entry.treatmentPlan,
      preventionPlan: entry.preventionPlan,
      severity: this.normalizeSeverity(entry.severity),
      notes: entry.notes,
    };
  }

  private parseStringArray(value: string) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  }

  private csvToList(value: string) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private mergeUniqueStrings(base: string[], incoming: string[]) {
    const normalized = new Set<string>();
    const output: string[] = [];

    for (const value of [...base, ...incoming]) {
      const item = value.trim();
      const key = item.toLowerCase();

      if (!item || normalized.has(key)) {
        continue;
      }

      normalized.add(key);
      output.push(item);
    }

    return output;
  }

  private normalizeSeverity(value: string): KnowledgeEntryEntity['severity'] {
    if (value === 'low' || value === 'medium' || value === 'high') {
      return value;
    }

    return 'medium';
  }

  private defaultKnowledgeEntries(): SeedKnowledgeEntry[] {
    return [
      {
        cropName: 'Tomato',
        diseaseName: 'Early blight',
        aliases: ['alternaria', 'brown concentric lesions'],
        symptomKeywords: ['blight', 'brown rings', 'target spot', 'lower leaf'],
        medicineName: 'Mancozeb 80% WP',
        applicationRate: 'Apply 2.5 g per liter of water every 7 to 10 days after local approval.',
        treatmentPlan:
          'Remove heavily infected leaves, improve airflow, and begin protective fungicide coverage on the remaining canopy.',
        preventionPlan:
          'Avoid overhead irrigation, rotate crops, and keep field residue away from healthy plants.',
        severity: 'medium',
        notes:
          'Common in warm, wet conditions. Escalate quickly when lesions move from older leaves into the mid-canopy.',
      },
      {
        cropName: 'Tomato',
        diseaseName: 'Late blight',
        aliases: ['water-soaked lesions', 'rapid collapse'],
        symptomKeywords: ['late blight', 'water-soaked', 'leaf collapse', 'dark lesion'],
        medicineName: 'Metalaxyl + Mancozeb',
        applicationRate: 'Use only according to local label guidance and stop if expert review recommends a different protocol.',
        treatmentPlan:
          'Isolate affected plants fast, remove collapsing tissue, and prioritize immediate field inspection around infection hotspots.',
        preventionPlan:
          'Reduce leaf wetness, improve drainage, and monitor the full field after rainfall or cool humid nights.',
        severity: 'high',
        notes:
          'Treat as urgent because spread can accelerate rapidly in cool, wet weather.',
      },
      {
        cropName: 'Maize',
        diseaseName: 'Common rust',
        aliases: ['leaf rust', 'orange pustules'],
        symptomKeywords: ['rust', 'orange powder', 'pustules', 'leaf spots'],
        medicineName: 'Propiconazole',
        applicationRate: 'Apply at the locally approved rate when active lesions are spreading and canopy infection is increasing.',
        treatmentPlan:
          'Inspect neighboring plants, confirm upper canopy spread, and target early fungicide timing before severe tissue loss.',
        preventionPlan:
          'Use resistant varieties where possible, balance nutrition, and reduce prolonged leaf wetness in dense plantings.',
        severity: 'medium',
        notes:
          'Early control matters more than late rescue spraying once upper leaves are heavily affected.',
      },
      {
        cropName: 'Wheat',
        diseaseName: 'Stripe rust',
        aliases: ['yellow rust', 'stripe lesions'],
        symptomKeywords: ['stripe', 'yellow streak', 'rust', 'powder'],
        medicineName: 'Tebuconazole',
        applicationRate: 'Use the local label rate and re-check the crop after 7 days for new stripe formation.',
        treatmentPlan:
          'Scout quickly across the field, especially cool and humid pockets, and protect unaffected leaves before widespread spread.',
        preventionPlan:
          'Use certified seed, resistant varieties, and regular scouting during cool moist weather.',
        severity: 'high',
        notes:
          'Yield loss risk increases when the disease reaches the flag leaf stage.',
      },
      {
        cropName: 'Potato',
        diseaseName: 'Early blight',
        aliases: ['alternaria solani', 'target lesion'],
        symptomKeywords: ['blight', 'target spot', 'brown lesion', 'dry necrosis'],
        medicineName: 'Chlorothalonil',
        applicationRate: 'Apply according to the local label and maintain interval discipline if conditions stay favorable for disease.',
        treatmentPlan:
          'Remove badly affected leaves, protect the remaining canopy, and monitor stem involvement closely.',
        preventionPlan:
          'Rotate fields, avoid plant stress, and keep irrigation from creating long periods of leaf wetness.',
        severity: 'medium',
        notes:
          'Often associated with stressed plants and can be confused with nutrient issues early on.',
      },
      {
        cropName: 'Coffee',
        diseaseName: 'Coffee leaf rust',
        aliases: ['hemileia vastatrix', 'orange powder'],
        symptomKeywords: ['rust', 'orange spores', 'yellow spots', 'powder under leaf'],
        medicineName: 'Copper hydroxide',
        applicationRate: 'Use preventive or early-stage application rates approved for the local coffee program.',
        treatmentPlan:
          'Prune for airflow, remove severe infection pockets, and protect new flush where rust pressure is increasing.',
        preventionPlan:
          'Manage shade, improve airflow, maintain balanced nutrition, and monitor lower humid sections of the farm.',
        severity: 'medium',
        notes:
          'Rust pressure often rises with shade imbalance and prolonged humidity.',
      },
    ];
  }
}
