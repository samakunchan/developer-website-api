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

import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { ApiAuthService } from '../auth/api-auth.service';
import { Theme } from '@prisma/client';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: {
            getTheme: jest.fn().mockResolvedValue(Theme.forest),
            setTheme: jest
              .fn()
              .mockResolvedValue({ success: true, theme: Theme.forest }),
          },
        },
        {
          provide: ApiAuthService,
          useValue: {
            verifyToken: jest.fn().mockResolvedValue({
              id: 1,
              email: 'test@test.com',
              role: 'user',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTheme', () => {
    it('should return theme object', async () => {
      const result = await controller.getTheme();
      expect(service.getTheme).toHaveBeenCalled();
      expect(result).toEqual({ theme: Theme.forest });
    });
  });

  describe('setTheme', () => {
    it('should call service setTheme and return success response', async () => {
      const body = { theme: Theme.forest };
      const result = await controller.setTheme(body);
      expect(service.setTheme).toHaveBeenCalledWith(Theme.forest);
      expect(result).toEqual({ success: true, theme: Theme.forest });
    });
  });
});
