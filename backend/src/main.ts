import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { PrismaService } from './modules/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const prismaService = app.get(PrismaService);
  const configService = app.get(ConfigService);
  const uploadDirectory = join(
    process.cwd(),
    configService.get<string>('uploadDir') || 'uploads',
  );
  prismaService.enableShutdownHooks(app);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: [configService.get<string>('frontendOrigin') || 'http://localhost:5173'],
    credentials: true,
  });

  app.useStaticAssets(uploadDirectory, {
    prefix: '/uploads',
  });

  await app.listen(configService.get<number>('port') || 3000, '0.0.0.0');
}

void bootstrap();
