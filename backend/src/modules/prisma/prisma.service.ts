import {
  INestApplication,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaLibSql({
        url: process.env.DATABASE_URL || 'file:./dev.db',
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.ensureSqliteSchema();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', () => {
      void app.close();
    });
  }

  private async ensureSqliteSchema() {
    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"
      ON "User" ("email")
    `);

    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Diagnosis" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "userId" INTEGER NOT NULL,
        "cropId" INTEGER,
        "cropName" TEXT NOT NULL,
        "imageUrl" TEXT,
        "imageName" TEXT,
        "diseaseName" TEXT NOT NULL,
        "confidence" INTEGER NOT NULL,
        "recommendation" TEXT NOT NULL,
        "summary" TEXT NOT NULL,
        "severity" TEXT NOT NULL,
        "urgency" TEXT NOT NULL,
        "suspectedConditions" TEXT NOT NULL,
        "nextSteps" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "model" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Diagnosis_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User" ("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await this.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Diagnosis_userId_idx"
      ON "Diagnosis" ("userId")
    `);
  }
}
