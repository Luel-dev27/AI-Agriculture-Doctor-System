import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import envConfig from './config/env.config';
import { validateEnv } from './config/validate-env';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CropsModule } from './modules/crops/crops.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { UploadModule } from './modules/upload/upload.module';
import { AiModule } from './modules/ai/ai.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [envConfig, databaseConfig],
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CropsModule,
    DiagnosisModule,
    UploadModule,
    AiModule,
    KnowledgeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
