import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { ReviewDiagnosisDto } from './dto/review-diagnosis.dto';
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
      fieldNotes: body.fieldNotes,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('agronomist', 'admin')
  @Post(':id/review')
  review(
    @Param('id') id: string,
    @Req()
    request: Request & {
      user?: { id: number; name: string };
    },
    @Body() body: ReviewDiagnosisDto,
  ) {
    const diagnosisId = Number(id);

    if (!Number.isInteger(diagnosisId) || diagnosisId < 1) {
      throw new BadRequestException('Diagnosis id must be a positive integer.');
    }

    return this.diagnosisService.reviewDiagnosis({
      diagnosisId,
      reviewerId: request.user?.id ?? 0,
      reviewerName: request.user?.name?.trim() || 'Unknown reviewer',
      resolution: body.resolution,
      confirmedDiseaseName: body.confirmedDiseaseName,
      medicineName: body.medicineName,
      applicationRate: body.applicationRate,
      notes: body.notes,
    });
  }
}
