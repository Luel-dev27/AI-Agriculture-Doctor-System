import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class UploadService {
  async upload(file: {
    buffer: Buffer;
    originalname?: string;
    mimetype?: string;
  }) {
    const uploadDir = join('/tmp', 'ai-agriculture-doctor-uploads');
    await mkdir(uploadDir, { recursive: true });

    const extension = extname(file.originalname ?? '') || '.bin';
    const fileName = `${randomUUID()}${extension}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, file.buffer);

    return {
      message: 'File uploaded successfully',
      fileUrl: filePath,
      originalName: file.originalname ?? fileName,
      mimeType: file.mimetype ?? 'application/octet-stream',
    };
  }
}
