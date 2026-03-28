import { Body, Controller, Get, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  status() {
    return this.aiService.getStatus();
  }

  @Post('analyze')
  analyze(
    @Body() body: { imageUrl?: string; cropName?: string; fileName?: string },
  ) {
    return this.aiService.analyze(body);
  }
}
