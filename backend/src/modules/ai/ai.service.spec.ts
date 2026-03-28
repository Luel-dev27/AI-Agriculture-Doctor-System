import { AiService } from './ai.service';

describe('AiService', () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = '';
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
    jest.restoreAllMocks();
  });

  it('uses the mock path when no OpenAI key is configured', async () => {
    const service = new AiService();

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
    const service = new AiService();

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          diseaseName: 'Leaf rust',
          confidence: 42,
          recommendation: 'Possibly rust.',
          summary: 'Maybe fungal symptoms.',
          severity: 'medium',
          urgency: 'soon',
          suspectedConditions: ['Leaf rust'],
          nextSteps: ['Inspect the crop manually'],
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
    const service = new AiService();

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          diseaseName: 'Uncertain',
          confidence: 90,
          recommendation: 'Observe symptoms.',
          summary: 'The model is unsure.',
          severity: 'medium',
          urgency: 'soon',
          suspectedConditions: ['Leaf rust'],
          nextSteps: ['Capture another image'],
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
        suspectedConditions: ['coffee leaf rust', 'leaf spot', 'nutrient imbalance'],
      }),
    );
  });

  it('keeps a strong OpenAI response when the output is complete and confident', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const service = new AiService();

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          diseaseName: 'Coffee leaf rust',
          confidence: 91,
          recommendation: 'Remove infected leaves and improve airflow.',
          summary: 'Orange powdery lesions indicate likely rust.',
          severity: 'medium',
          urgency: 'soon',
          suspectedConditions: ['Coffee leaf rust', 'Leaf spot'],
          nextSteps: ['Inspect nearby branches', 'Confirm treatment plan locally'],
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
    const service = new AiService();

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
