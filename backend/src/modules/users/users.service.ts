import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { UserEntity } from './users.entity';
import { hashPassword } from '../auth/password.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureDemoUser();
  }

  async findByEmail(email: string): Promise<UserEntity | undefined> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    return user ? this.toEntity(user) : undefined;
  }

  async findById(id: number): Promise<UserEntity | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.toEntity(user) : undefined;
  }

  async getProfile(id = 1) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User profile was not found.');
    }

    return this.toPublicUser(user);
  }

  private async ensureDemoUser() {
    const demoPassword = process.env.DEMO_USER_PASSWORD || 'farmer123';
    const demoEmail = (
      process.env.DEMO_USER_EMAIL || 'farmer@example.com'
    ).toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (existingUser) {
      return;
    }

    await this.prisma.user.create({
      data: {
        name: 'Demo Farmer',
        email: demoEmail,
        role: 'farmer',
        passwordHash: hashPassword(demoPassword),
      },
    });
  }

  toPublicUser(user: UserEntity) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toEntity(user: {
    id: number;
    name: string;
    email: string;
    role: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserEntity['role'],
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
