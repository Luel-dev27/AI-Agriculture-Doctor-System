import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('API flow (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken = '';
  let adminAccessToken = '';
  let refreshToken = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / should return health information', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({
        name: 'AI Agriculture Doctor System API',
        status: 'ok',
      });
  });

  it('GET /crops should return the crop catalog', async () => {
    const response = await request(app.getHttpServer()).get('/crops').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
      }),
    );
  });

  it('POST /auth/login should issue a token for the demo user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'farmer@example.com',
        password: 'farmer123',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          email: 'farmer@example.com',
          role: 'farmer',
        }),
      }),
    );

    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
  });

  it('POST /auth/login should issue a token for the demo admin user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin1234',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          email: 'admin@example.com',
          role: 'admin',
        }),
      }),
    );

    adminAccessToken = response.body.accessToken;
  });

  it('POST /auth/register should create a new farmer account', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'E2E Farmer',
        email: `e2e-${Date.now()}@example.com`,
        password: 'fieldtest123',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          role: 'farmer',
        }),
      }),
    );
  });

  it('GET /users/me should return the signed-in user profile', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        email: 'farmer@example.com',
        role: 'farmer',
      }),
    );
  });

  it('POST /auth/refresh should return a new session from a valid refresh token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          email: 'farmer@example.com',
        }),
      }),
    );

    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
  });

  it('GET /users should reject non-admin users', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('GET /users should allow admin users to list accounts', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(1);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        email: expect.any(String),
        role: expect.any(String),
      }),
    );
  });

  it('POST /users/staff should allow admins to create staff users', async () => {
    const response = await request(app.getHttpServer())
      .post('/users/staff')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        name: 'E2E Agronomist',
        email: `agronomist-${Date.now()}@example.com`,
        password: 'fieldteam123',
        role: 'agronomist',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        email: expect.stringContaining('@example.com'),
        role: 'agronomist',
      }),
    );
  });

  it('POST /upload should store an image and return a public upload URL', async () => {
    const response = await request(app.getHttpServer())
      .post('/upload')
      .attach('file', Buffer.from('fake-image-content'), 'leaf-rust.jpg')
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        fileUrl: expect.stringContaining('/uploads/'),
        originalName: 'leaf-rust.jpg',
        mimeType: 'image/jpeg',
      }),
    );
  });

  it('POST /diagnosis should create a diagnosis record', async () => {
    const response = await request(app.getHttpServer())
      .post('/diagnosis')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        cropName: 'Tomato',
        imageUrl: 'rust-e2e-sample.jpg',
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        cropName: 'Tomato',
        diseaseName: expect.any(String),
        provider: expect.any(String),
      }),
    );
  });

  it('POST /diagnosis should accept multipart image uploads and persist a public image URL', async () => {
    const response = await request(app.getHttpServer())
      .post('/diagnosis')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('cropName', 'Tomato')
      .attach('image', Buffer.from('fake-diagnosis-image'), 'healthy-leaf.jpg')
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        cropName: 'Tomato',
        imageUrl: expect.stringContaining('/uploads/'),
        imageName: 'healthy-leaf.jpg',
      }),
    );
  });

  it('GET /diagnosis/history should return at least one saved diagnosis', async () => {
    const response = await request(app.getHttpServer())
      .get('/diagnosis/history')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        cropName: expect.any(String),
        diseaseName: expect.any(String),
        userEmail: 'farmer@example.com',
      }),
    );
  });

  it('POST /auth/logout should invalidate the current session version', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken,
      })
      .expect(401);
  });
});
