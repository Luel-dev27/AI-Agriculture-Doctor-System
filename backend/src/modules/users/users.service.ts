import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
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

  async findAllPublicUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => this.toPublicUser(this.toEntity(user)));
  }

  async createUser(input: {
    name: string;
    email: string;
    password: string;
    role?: UserEntity['role'];
  }): Promise<UserEntity> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('An account with that email already exists.');
    }

    const createdUser = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        role: input.role || 'farmer',
        passwordHash: hashPassword(input.password),
        sessionVersion: 0,
      },
    });

    return this.toEntity(createdUser);
  }

  private async ensureDemoUser() {
    const demoPassword = process.env.DEMO_USER_PASSWORD || 'farmer123';
    const demoEmail = (
      process.env.DEMO_USER_EMAIL || 'farmer@example.com'
    ).toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (!existingUser) {
      await this.prisma.user.create({
        data: {
          name: 'Demo Farmer',
        email: demoEmail,
        role: 'farmer',
        passwordHash: hashPassword(demoPassword),
        sessionVersion: 0,
      },
    });
    }

    const adminPassword = process.env.DEMO_ADMIN_PASSWORD || 'admin1234';
    const adminEmail = (
      process.env.DEMO_ADMIN_EMAIL || 'admin@example.com'
    ).toLowerCase();
    const existingAdmin = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      return;
    }

    await this.prisma.user.create({
      data: {
        name: 'Demo Admin',
        email: adminEmail,
        role: 'admin',
        passwordHash: hashPassword(adminPassword),
        sessionVersion: 0,
      },
    });
  }

  async incrementSessionVersion(id: number) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        sessionVersion: {
          increment: 1,
        },
      },
    });

    return this.toEntity(user);
  }

  toPublicUser(user: {
    id: number;
    name: string;
    email: string;
    role: UserEntity['role'];
    sessionVersion?: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion,
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
    sessionVersion: number;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserEntity['role'],
      passwordHash: user.passwordHash,
      sessionVersion: user.sessionVersion,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
