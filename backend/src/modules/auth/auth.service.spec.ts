import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { hashPassword } from './password.util';

describe('AuthService', () => {
  const demoUser = {
    id: 1,
    name: 'Demo Farmer',
    email: 'farmer@example.com',
    role: 'farmer' as const,
    passwordHash: hashPassword('farmer123'),
    sessionVersion: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    createUser: jest.fn(),
    incrementSessionVersion: jest.fn(),
    toPublicUser: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    usersService.findByEmail.mockReturnValue(demoUser);
    usersService.findById.mockResolvedValue(demoUser);
    usersService.createUser.mockResolvedValue(demoUser);
    usersService.incrementSessionVersion.mockResolvedValue({
      ...demoUser,
      sessionVersion: 1,
    });
    usersService.toPublicUser.mockReturnValue({
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      sessionVersion: demoUser.sessionVersion,
      createdAt: demoUser.createdAt,
      updatedAt: demoUser.updatedAt,
    });
    jwtService.signAsync
      .mockResolvedValueOnce('signed-access-jwt')
      .mockResolvedValueOnce('signed-refresh-jwt');
    jwtService.verifyAsync.mockReset();
    authService = new AuthService(usersService as never, jwtService as never);
  });

  it('returns a signed token and public user profile for valid credentials', async () => {
    await expect(
      authService.login('farmer@example.com', 'farmer123'),
    ).resolves.toEqual({
      accessToken: 'signed-access-jwt',
      refreshToken: 'signed-refresh-jwt',
      user: {
        id: 1,
        name: 'Demo Farmer',
        email: 'farmer@example.com',
        role: 'farmer',
        sessionVersion: 0,
        createdAt: demoUser.createdAt,
        updatedAt: demoUser.updatedAt,
      },
    });
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(1, {
      sub: 1,
      email: 'farmer@example.com',
      role: 'farmer',
      name: 'Demo Farmer',
      sessionVersion: 0,
      tokenType: 'access',
    }, {
      expiresIn: '15m',
    });
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(2, {
      sub: 1,
      email: 'farmer@example.com',
      role: 'farmer',
      name: 'Demo Farmer',
      sessionVersion: 0,
      tokenType: 'refresh',
    }, {
      expiresIn: '7d',
    });
  });

  it('rejects invalid credentials', async () => {
    await expect(
      authService.login('farmer@example.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('registers a user and returns a signed session', async () => {
    await expect(
      authService.register('New Farmer', 'new@example.com', 'farmer1234'),
    ).resolves.toEqual({
      accessToken: 'signed-access-jwt',
      refreshToken: 'signed-refresh-jwt',
      user: {
        id: 1,
        name: 'Demo Farmer',
        email: 'farmer@example.com',
        role: 'farmer',
        sessionVersion: 0,
        createdAt: demoUser.createdAt,
        updatedAt: demoUser.updatedAt,
      },
    });

    expect(usersService.createUser).toHaveBeenCalledWith({
      name: 'New Farmer',
      email: 'new@example.com',
      password: 'farmer1234',
      role: 'farmer',
    });
  });

  it('surfaces duplicate-account conflicts during registration', async () => {
    usersService.createUser.mockRejectedValueOnce(
      new ConflictException('An account with that email already exists.'),
    );

    await expect(
      authService.register('Demo Farmer', 'farmer@example.com', 'farmer123'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refreshes a valid refresh token into a new session', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: 1,
      email: 'farmer@example.com',
      role: 'farmer',
      name: 'Demo Farmer',
      sessionVersion: 0,
      tokenType: 'refresh',
    });
    jwtService.signAsync.mockReset();
    jwtService.signAsync
      .mockResolvedValueOnce('new-access-jwt')
      .mockResolvedValueOnce('new-refresh-jwt');

    await expect(authService.refresh('refresh-token')).resolves.toEqual({
      accessToken: 'new-access-jwt',
      refreshToken: 'new-refresh-jwt',
      user: expect.objectContaining({
        email: 'farmer@example.com',
      }),
    });
  });

  it('invalidates active sessions on logout', async () => {
    await expect(authService.logout(1)).resolves.toEqual({ success: true });
    expect(usersService.incrementSessionVersion).toHaveBeenCalledWith(1);
  });
});
