import { Test, TestingModule } from '@nestjs/testing';

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
    },
  }),
}));

import { ApiAuthController } from './api-auth.controller';
import { ApiAuthService } from './api-auth.service';

describe('ApiAuthController', () => {
  let controller: ApiAuthController;
  let service: ApiAuthService;

  const mockUser = {
    id: 1,
    email: 'test@test.com',
    name: 'Sama Test',
    role: 'user',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiAuthController],
      providers: [
        {
          provide: ApiAuthService,
          useValue: {
            signIn: jest.fn().mockResolvedValue({ token: 'signed-token', user: mockUser }),
            verifyToken: jest.fn().mockResolvedValue(mockUser),
            signOut: jest.fn().mockResolvedValue({ success: true }),
            forgotPassword: jest.fn().mockResolvedValue({ success: true }),
            resetPassword: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<ApiAuthController>(ApiAuthController);
    service = module.get<ApiAuthService>(ApiAuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should authenticate user and return token in body', async () => {
      const body = { email: 'test@test.com', password: 'password' };
      const result = await controller.signIn(body);

      expect(service.signIn).toHaveBeenCalledWith(body);
      expect(result).toEqual({
        success: true,
        token: 'signed-token',
        user: mockUser,
      });
    });
  });

  describe('signOut', () => {
    it('should call service signOut and return success', async () => {
      const req = { user: { id: 1 } } as any;
      const result = await controller.signOut(req);

      expect(service.signOut).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
  });

  describe('forgotPassword', () => {
    it('should call service forgotPassword and return success', async () => {
      const body = { email: 'test@test.com' };
      const result = await controller.forgotPassword(body);

      expect(service.forgotPassword).toHaveBeenCalledWith(body);
      expect(result).toEqual({ success: true });
    });
  });

  describe('resetPassword', () => {
    it('should call service resetPassword and return success', async () => {
      const body = {
        token: 'reset-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      };
      const result = await controller.resetPassword(body);

      expect(service.resetPassword).toHaveBeenCalledWith(body);
      expect(result).toEqual({ success: true });
    });
  });
});
