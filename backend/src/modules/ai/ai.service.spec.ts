import { AiService } from './ai.service';
import { KnowledgeService } from '../knowledge/knowledge.service';

describe('AiService', () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const knowledgeService = {
    findCandidateEntries: jest.fn().mockImplementation(async (input) => {
      if (input?.cropName === 'Tomato') {
        return [
          {
            id: 2,
            cropName: 'Tomato',
            diseaseName: 'Leaf rust',
            aliases: ['orange powder'],
            symptomKeywords: ['rust', 'powder'],
            medicineName: 'Mancozeb',
            applicationRate: 'Use approved local label rate.',
            treatmentPlan: 'Inspect the crop manually.',
            preventionPlan: 'Manage humidity and scout regularly.',
            severity: 'medium',
            notes: 'Seeded tomato entry',
          },
        ];
      }

      return [
        {
          id: 1,
          cropName: 'Coffee',
          diseaseName: 'Coffee leaf rust',
          aliases: ['orange powder'],
          symptomKeywords: ['rust', 'orange spores'],
          medicineName: 'Copper hydroxide',
          applicationRate: 'Use approved local label rate.',
          treatmentPlan: 'Remove infected leaves and improve airflow.',
          preventionPlan: 'Manage humidity and scout regularly.',
          severity: 'medium',
          notes: 'Seeded coffee entry',
        },
      ];
    }),
    findAllForCrop: jest.fn().mockImplementation(async (cropName) => {
      if (cropName === 'Tomato') {
        return [
          {
            id: 2,
            cropName: 'Tomato',
            diseaseName: 'Leaf rust',
            aliases: ['orange powder'],
            symptomKeywords: ['rust', 'powder'],
            medicineName: 'Mancozeb',
            applicationRate: 'Use approved local label rate.',
            treatmentPlan: 'Inspect the crop manually.',
            preventionPlan: 'Manage humidity and scout regularly.',
            severity: 'medium',
            notes: 'Seeded tomato entry',
          },
        ];
      }

      return [
        {
          id: 1,
          cropName: 'Coffee',
          diseaseName: 'Coffee leaf rust',
          aliases: ['orange powder'],
          symptomKeywords: ['rust', 'orange spores'],
          medicineName: 'Copper hydroxide',
          applicationRate: 'Use approved local label rate.',
          treatmentPlan: 'Remove infected leaves and improve airflow.',
          preventionPlan: 'Manage humidity and scout regularly.',
          severity: 'medium',
          notes: 'Seeded coffee entry',
        },
      ];
    }),
    findBestMatchByDiseaseName: jest.fn().mockImplementation(async (input) => {
      if (input?.diseaseName?.toLowerCase() === 'coffee leaf rust') {
        return {
          id: 1,
          cropName: 'Coffee',
          diseaseName: 'Coffee leaf rust',
          aliases: ['orange powder'],
          symptomKeywords: ['rust', 'orange spores'],
          medicineName: 'Copper hydroxide',
          applicationRate: 'Use approved local label rate.',
          treatmentPlan: 'Remove infected leaves and improve airflow.',
          preventionPlan: 'Manage humidity and scout regularly.',
          severity: 'medium',
          notes: 'Seeded coffee entry',
        };
      }

      if (input?.diseaseName?.toLowerCase() === 'leaf rust') {
        return {
          id: 2,
          cropName: 'Tomato',
          diseaseName: 'Leaf rust',
          aliases: ['orange powder'],
          symptomKeywords: ['rust', 'powder'],
          medicineName: 'Mancozeb',
          applicationRate: 'Use approved local label rate.',
          treatmentPlan: 'Inspect the crop manually.',
          preventionPlan: 'Manage humidity and scout regularly.',
          severity: 'medium',
          notes: 'Seeded tomato entry',
        };
      }

      return undefined;
    }),
  } as unknown as KnowledgeService;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = '';
    jest.restoreAllMocks();
    (knowledgeService.findCandidateEntries as jest.Mock).mockClear();
    (knowledgeService.findAllForCrop as jest.Mock).mockClear();
    (knowledgeService.findBestMatchByDiseaseName as jest.Mock).mockClear();
  });

  afterAll(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
    jest.restoreAllMocks();
  });

  it('uses the mock path when no OpenAI key is configured', async () => {
    const service = new AiService(knowledgeService);

    await expect(
      service.analyze({
        cropName: 'Tomato',
        imageUrl: 'rust-sample.jpg',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        diseaseName: 'Leaf rust',
        provider: 'mock',
      }),
    );
  });

  it('falls back to expert review when OpenAI returns low confidence output', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const service = new AiService(knowledgeService);

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          diseaseName: 'Leaf rust',
          confidence: 42,
          recommendation: 'Possibly rust.',
          summary: 'Maybe fungal symptoms.',
          medicineName: 'Copper hydroxide',
          applicationRate: 'Use approved local label rate.',
          preventionPlan: 'Manage humidity and scout regularly.',
          severity: 'medium',
          urgency: 'soon',
          suspectedConditions: ['Leaf rust'],
          nextSteps: ['Inspect the crop manually'],
          knowledgeMatches: ['Coffee: Coffee leaf rust'],
        }),
      }),
    } as Response);

    await expect(
      service.analyze({
        cropName: 'Tomato',
        imageBuffer: Buffer.from('fake-image'),
        mimeType: 'image/jpeg',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        diseaseName: 'Needs expert review',
        confidence: 58,
        provider: 'openai',
      }),
    );
  });

  it('falls back to expert review when OpenAI returns an uncertain disease label', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const service = new AiService(knowledgeService);

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          diseaseName: 'Uncertain',
          confidence: 90,
          recommendation: 'Observe symptoms.',
          summary: 'The model is unsure.',
          medicineName: 'Copper hydroxide',
          applicationRate: 'Use approved local label rate.',
          preventionPlan: 'Manage humidity and scout regularly.',
          severity: 'medium',
          urgency: 'soon',
          suspectedConditions: ['Leaf rust'],
          nextSteps: ['Capture another image'],
          knowledgeMatches: ['Coffee: Coffee leaf rust'],
        }),
      }),
    } as Response);

    await expect(
      service.analyze({
        cropName: 'Coffee',
        imageBuffer: Buffer.from('fake-image'),
        mimeType: 'image/jpeg',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        diseaseName: 'Needs expert review',
        provider: 'openai',
        knowledgeMatches: ['Coffee: Coffee leaf rust'],
      }),
    );
  });

  it('keeps a strong OpenAI response when the output is complete and confident', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const service = new AiService(knowledgeService);

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          diseaseName: 'Coffee leaf rust',
          confidence: 91,
          recommendation: 'Remove infected leaves and improve airflow.',
          summary: 'Orange powdery lesions indicate likely rust.',
          medicineName: 'Copper hydroxide',
          applicationRate: 'Use approved local label rate.',
          preventionPlan: 'Manage humidity and scout regularly.',
          severity: 'medium',
          urgency: 'soon',
          suspectedConditions: ['Coffee leaf rust', 'Leaf spot'],
          nextSteps: ['Inspect nearby branches', 'Confirm treatment plan locally'],
          knowledgeMatches: ['Coffee: Coffee leaf rust'],
        }),
      }),
    } as Response);

    await expect(
      service.analyze({
        cropName: 'Coffee',
        imageBuffer: Buffer.from('fake-image'),
        mimeType: 'image/jpeg',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        diseaseName: 'Coffee leaf rust',
        confidence: 91,
        provider: 'openai',
      }),
    );
  });

  it('falls back to mock analysis when the OpenAI request fails', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const service = new AiService(knowledgeService);

    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network failure'));

    await expect(
      service.analyze({
        cropName: 'Tomato',
        imageUrl: 'healthy-sample.jpg',
        imageBuffer: Buffer.from('fake-image'),
        mimeType: 'image/jpeg',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        diseaseName: 'Healthy crop',
        provider: 'mock',
      }),
    );
  });
});
