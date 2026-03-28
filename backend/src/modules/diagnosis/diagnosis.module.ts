import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { UploadModule } from '../upload/upload.module';
import { UsersModule } from '../users/users.module';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisRepository } from './diagnosis.repository';
import { DiagnosisService } from './diagnosis.service';

@Module({
  imports: [AiModule, UploadModule, UsersModule],
  controllers: [DiagnosisController],
  providers: [DiagnosisService, DiagnosisRepository],
  exports: [DiagnosisService],
})
export class DiagnosisModule {}
