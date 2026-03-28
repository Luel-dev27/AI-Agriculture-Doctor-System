import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class UploadService {
  private readonly uploadDirectory =
    process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  private readonly publicBaseUrl =
    process.env.PUBLIC_API_URL || 'http://localhost:3000';

  async upload(file: {
    buffer: Buffer;
    originalname?: string;
    mimetype?: string;
  }) {
    await mkdir(this.uploadDirectory, { recursive: true });

    const extension = extname(file.originalname ?? '') || '.bin';
    const fileName = `${randomUUID()}${extension}`;
    const filePath = join(this.uploadDirectory, fileName);

    await writeFile(filePath, file.buffer);

    return {
      message: 'File uploaded successfully',
      fileUrl: `${this.publicBaseUrl}/uploads/${fileName}`,
      originalName: file.originalname ?? fileName,
      mimeType: file.mimetype ?? 'application/octet-stream',
    };
  }
}
