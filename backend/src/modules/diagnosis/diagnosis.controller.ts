import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { DiagnosisService } from './diagnosis.service';

@Controller('diagnosis')
export class DiagnosisController {
  private static readonly MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

  constructor(private readonly diagnosisService: DiagnosisService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Req()
    request: Request & {
      user?: { id: number; name: string; email: string };
    },
    @UploadedFile()
    file:
      | {
          originalname?: string;
          mimetype?: string;
          size?: number;
          buffer?: Buffer;
        }
      | undefined,
    @Body() body: CreateDiagnosisDto,
  ) {
    if (!file?.buffer && !body.imageUrl) {
      throw new BadRequestException(
        'Either an image file or imageUrl must be provided.',
      );
    }

    if (file?.mimetype && !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed.');
    }

    if ((file?.size ?? 0) > DiagnosisController.MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Image uploads must be 10MB or smaller.');
    }

    return this.diagnosisService.create({
      userId: request.user?.id,
      userName: request.user?.name,
      userEmail: request.user?.email,
      cropId: body.cropId,
      cropName: body.cropName,
      imageUrl: body.imageUrl,
      imageName: file?.originalname,
      mimeType: file?.mimetype,
      imageBuffer: file?.buffer,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  history(
    @Req()
    request: Request & {
      user?: { id: number };
    },
  ) {
    return this.diagnosisService.history(request.user?.id);
  }
}
