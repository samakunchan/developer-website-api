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
      apiSessionId: 'api-session-id',
    },
  }),
}));

import { ApiAuthService } from './api-auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

describe('ApiAuthService', () => {
  let service: ApiAuthService;
  let prisma: PrismaService;
  let emailService: EmailService;

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
    currentApiSessionId: 'api-session-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiAuthService,
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

    service = module.get<ApiAuthService>(ApiAuthService);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.signIn({ email: 'nonexistent@test.com', password: 'password' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        lockoutUntil: new Date(Date.now() + 1000 * 60 * 15),
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(lockedUser);

      await expect(service.signIn({ email: 'test@test.com', password: 'password' })).rejects.toThrow(BadRequestException);
    });

    it('should authenticate successfully with correct password and set currentApiSessionId', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => Promise.resolve(true));

      const updateSpy = jest.spyOn(prisma.user, 'update');

      const result = await service.signIn({
        email: 'test@test.com',
        password: 'password',
      });

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(mockUser.email);
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          failedLoginAttempts: 0,
          currentApiSessionId: expect.any(String),
        }),
      });
    });
  });

  describe('signOut', () => {
    it('should set currentApiSessionId to null', async () => {
      const updateSpy = jest.spyOn(prisma.user, 'update');

      const result = await service.signOut(1);

      expect(result).toEqual({ success: true });
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { currentApiSessionId: null },
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify token and return user if currentApiSessionId matches', async () => {
      const result = await service.verifyToken('valid-token');
      expect(result).toBeDefined();
      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null if currentApiSessionId does not match token', async () => {
      const mismatchedUser = {
        ...mockUser,
        currentApiSessionId: 'different-session-id',
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(mismatchedUser);

      const result = await service.verifyToken('valid-token');
      expect(result).toBeNull();
    });
  });

  describe('forgotPassword', () => {
    it('should generate resetToken and send email', async () => {
      const updateSpy = jest.spyOn(prisma.user, 'update');
      const emailSpy = jest.spyOn(emailService, 'sendEmail');

      const result = await service.forgotPassword({ email: 'test@test.com' });

      expect(result).toEqual({ success: true });
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          resetToken: expect.any(String),
          resetTokenExpiry: expect.any(Date),
        }),
      });
      expect(emailSpy).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password and clear sessions', async () => {
      const testUser = {
        ...mockUser,
        resetToken: 'reset-token',
        resetTokenExpiry: new Date(Date.now() + 1000 * 60 * 30),
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(testUser);
      const updateSpy = jest.spyOn(prisma.user, 'update');
      jest.spyOn(bcrypt, 'hash').mockImplementationOnce(() => Promise.resolve('new-hashed-password') as any);

      const result = await service.resetPassword({
        token: 'reset-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      });

      expect(result).toEqual({ success: true });
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: {
          password: 'new-hashed-password',
          resetToken: null,
          resetTokenExpiry: null,
          failedLoginAttempts: 0,
          lockoutUntil: null,
          currentSessionId: null,
          currentApiSessionId: null,
        },
      });
    });
  });
});
