import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

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

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser = {
    id: 1,
    email: 'test@test.com',
    name: 'Sama Test',
    role: 'user',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signIn: jest.fn().mockResolvedValue({ token: 'signed-token', user: mockUser }),
            signOut: jest.fn().mockResolvedValue({ success: true }),
            verifySession: jest.fn().mockResolvedValue(mockUser),
            forgotPassword: jest.fn().mockResolvedValue({ success: true }),
            resetPassword: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should authenticate user and set cookie', async () => {
      const res = {
        cookie: jest.fn(),
      } as unknown as Response;

      const body = { email: 'test@test.com', password: 'password' };
      const result = await controller.signIn(body, res);

      expect(service.signIn).toHaveBeenCalledWith(body);
      expect(res.cookie).toHaveBeenCalledWith('auth_session', 'signed-token', expect.any(Object));
      expect(result).toEqual({ success: true, user: mockUser });
    });
  });
});
