import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock jose module to prevent ESM import issues in Jest
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('signed-token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: {
      sub: '1',
      email: 'test@test.com',
      role: 'user',
      name: 'Sama Test',
      sessionId: 'session-id',
    },
  }),
}));

import { WebAuthService } from './web-auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

describe('WebAuthService', () => {
  let service: WebAuthService;
  let prisma: PrismaService;

  const mockUser = {
    id: 1,
    name: 'Sama Test',
    email: 'test@test.com',
    emailVerified: null,
    password: 'hashed-password',
    role: 'user' as const,
    resetToken: null,
    resetTokenExpiry: null,
    failedLoginAttempts: 0,
    lockoutUntil: null,
    currentSessionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebAuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue(mockUser),
              update: jest.fn().mockResolvedValue(mockUser),
            },
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue({ messageId: '123' }),
          },
        },
      ],
    }).compile();

    service = module.get<WebAuthService>(WebAuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        service.signIn({ email: 'nonexistent@test.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        lockoutUntil: new Date(Date.now() + 1000 * 60 * 15),
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(lockedUser);

      await expect(
        service.signIn({ email: 'test@test.com', password: 'password' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should authenticate successfully with correct password', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementationOnce(() => Promise.resolve(true));

      const result = await service.signIn({
        email: 'test@test.com',
        password: 'password',
      });

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(mockUser.email);
    });
  });
});
