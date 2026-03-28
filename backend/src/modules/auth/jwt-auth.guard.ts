import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { AuthTokenPayload } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token is required.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
        token,
        {
          secret: this.configService.get<string>('jwtSecret') || 'change-me',
        },
      );
      if (payload.tokenType !== 'access') {
        throw new UnauthorizedException(
          'Access token is required for this endpoint.',
        );
      }

      const user = await this.usersService.findById(payload.sub);

      if (!user || user.sessionVersion !== payload.sessionVersion) {
        throw new UnauthorizedException(
          'Invalid or expired authorization token.',
        );
      }

      request.user = this.usersService.toPublicUser(user);
      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authorization token.',
      );
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
