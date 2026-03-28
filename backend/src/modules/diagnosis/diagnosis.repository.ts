import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DiagnosisEntity } from './diagnosis.entity';

@Injectable()
export class DiagnosisRepository {
  private readonly dataDirectory = join(process.cwd(), 'data');
  private readonly filePath = join(this.dataDirectory, 'diagnoses.json');

  async findAll(): Promise<DiagnosisEntity[]> {
    await this.ensureStore();

    const raw = await readFile(this.filePath, 'utf8');
    const items = JSON.parse(raw) as Array<
      DiagnosisEntity & { createdAt: string }
    >;

    return items.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }));
  }

  async save(diagnosis: DiagnosisEntity): Promise<DiagnosisEntity> {
    const items = await this.findAll();
    items.unshift(diagnosis);
    await writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf8');
    return diagnosis;
  }

  private async ensureStore(): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true });

    try {
      await readFile(this.filePath, 'utf8');
    } catch {
      await writeFile(this.filePath, '[]', 'utf8');
    }
  }
}
