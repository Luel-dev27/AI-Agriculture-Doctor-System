import { Module } from '@nestjs/common';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [KnowledgeModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
