import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { hashPassword } from './password.util';

describe('AuthService', () => {
  const demoUser = {
    id: 1,
    name: 'Demo Farmer',
    email: 'farmer@example.com',
    role: 'farmer' as const,
    passwordHash: hashPassword('farmer123'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const usersService = {
    findByEmail: jest.fn(),
    toPublicUser: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    usersService.findByEmail.mockReturnValue(demoUser);
    usersService.toPublicUser.mockReturnValue({
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      createdAt: demoUser.createdAt,
      updatedAt: demoUser.updatedAt,
    });
    jwtService.signAsync.mockResolvedValue('signed-jwt');
    authService = new AuthService(usersService as never, jwtService as never);
  });

  it('returns a signed token and public user profile for valid credentials', async () => {
    await expect(
      authService.login('farmer@example.com', 'farmer123'),
    ).resolves.toEqual({
      accessToken: 'signed-jwt',
      user: {
        id: 1,
        name: 'Demo Farmer',
        email: 'farmer@example.com',
        role: 'farmer',
        createdAt: demoUser.createdAt,
        updatedAt: demoUser.updatedAt,
      },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'farmer@example.com',
      role: 'farmer',
      name: 'Demo Farmer',
    });
  });

  it('rejects invalid credentials', async () => {
    await expect(
      authService.login('farmer@example.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
