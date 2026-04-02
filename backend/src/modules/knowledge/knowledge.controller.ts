import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpsertKnowledgeEntryDto } from './dto/upsert-knowledge-entry.dto';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('cropName') cropName?: string) {
    return this.knowledgeService.findAllForCrop(cropName);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  upsert(@Body() body: UpsertKnowledgeEntryDto) {
    return this.knowledgeService.upsertManualEntry(body);
  }
}
