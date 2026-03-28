import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthTokenPayload } from './auth.types';
import { verifyPassword } from './password.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = verifyPassword(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.issueSession(user);
  }

  async register(name: string, email: string, password: string) {
    const user = await this.usersService.createUser({
      name,
      email,
      password,
      role: 'farmer',
    });

    return this.issueSession(user);
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
      refreshToken,
      {
        secret: process.env.JWT_SECRET || 'change-me',
      },
    );

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user || user.sessionVersion !== payload.sessionVersion) {
      throw new UnauthorizedException('Refresh token is no longer valid.');
    }

    return this.issueSession(user);
  }

  async logout(userId: number) {
    await this.usersService.incrementSessionVersion(userId);
    return { success: true };
  }

  private async issueSession(user: {
    id: number;
    name: string;
    email: string;
    role: 'farmer' | 'agronomist' | 'admin';
    sessionVersion: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const accessPayload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      sessionVersion: user.sessionVersion,
      tokenType: 'access',
    };
    const refreshPayload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      sessionVersion: user.sessionVersion,
      tokenType: 'refresh',
    };

    return {
      accessToken: await this.jwtService.signAsync(accessPayload, {
        expiresIn: '15m',
      }),
      refreshToken: await this.jwtService.signAsync(refreshPayload, {
        expiresIn: '7d',
      }),
      user: this.usersService.toPublicUser(user),
    };
  }
}
