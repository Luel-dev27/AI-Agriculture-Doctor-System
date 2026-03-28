import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  private static readonly MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile()
    file: {
      buffer: Buffer;
      originalname?: string;
      mimetype?: string;
      size?: number;
    },
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('A file upload is required.');
    }

    if (file.mimetype && !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed.');
    }

    if ((file.size ?? 0) > UploadController.MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Image uploads must be 10MB or smaller.');
    }

    return this.uploadService.upload(file);
  }
}
