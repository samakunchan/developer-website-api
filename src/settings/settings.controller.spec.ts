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
      role: 'admin',
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
            setTheme: jest.fn().mockResolvedValue({ success: true, theme: Theme.forest }),
            getLegalMentions: jest.fn(),
            setLegalMentions: jest.fn(),
            getCGU: jest.fn(),
            setCGU: jest.fn(),
            getPrivacyPolicy: jest.fn(),
            setPrivacyPolicy: jest.fn(),
            getCookiePolicy: jest.fn(),
            setCookiePolicy: jest.fn(),
          },
        },
        {
          provide: ApiAuthService,
          useValue: {
            verifyToken: jest.fn().mockResolvedValue({
              id: 1,
              email: 'test@test.com',
              role: 'admin',
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

  describe('LegalMentions endpoints', () => {
    const mockDoc = { id: 1, title: 'Mentions Légales', content: '{"root":{"type":"root","version":1,"children":[]}}' };

    it('should return legal mentions', async () => {
      jest.spyOn(service, 'getLegalMentions').mockResolvedValueOnce(mockDoc as any);
      const result = await controller.getLegalMentions();
      expect(service.getLegalMentions).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should update legal mentions', async () => {
      const body = { title: 'Mentions Légales', content: '{"root":{"type":"root","version":1,"children":[]}}' };
      jest.spyOn(service, 'setLegalMentions').mockResolvedValueOnce(mockDoc as any);
      const result = await controller.setLegalMentions(body as any);
      expect(service.setLegalMentions).toHaveBeenCalledWith(body.title, body.content);
      expect(result).toEqual(mockDoc);
    });
  });

  describe('CGU endpoints', () => {
    const mockDoc = { id: 1, title: 'CGU', content: '{"root":{"type":"root","version":1,"children":[]}}' };

    it('should return cgu', async () => {
      jest.spyOn(service, 'getCGU').mockResolvedValueOnce(mockDoc as any);
      const result = await controller.getCGU();
      expect(service.getCGU).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should update cgu', async () => {
      const body = { title: 'CGU', content: '{"root":{"type":"root","version":1,"children":[]}}' };
      jest.spyOn(service, 'setCGU').mockResolvedValueOnce(mockDoc as any);
      const result = await controller.setCGU(body as any);
      expect(service.setCGU).toHaveBeenCalledWith(body.title, body.content);
      expect(result).toEqual(mockDoc);
    });
  });

  describe('PrivacyPolicy endpoints', () => {
    const mockDoc = { id: 1, title: 'Privacy Policy', content: '{"root":{"type":"root","version":1,"children":[]}}' };

    it('should return privacy policy', async () => {
      jest.spyOn(service, 'getPrivacyPolicy').mockResolvedValueOnce(mockDoc as any);
      const result = await controller.getPrivacyPolicy();
      expect(service.getPrivacyPolicy).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should update privacy policy', async () => {
      const body = { title: 'Privacy Policy', content: '{"root":{"type":"root","version":1,"children":[]}}' };
      jest.spyOn(service, 'setPrivacyPolicy').mockResolvedValueOnce(mockDoc as any);
      const result = await controller.setPrivacyPolicy(body as any);
      expect(service.setPrivacyPolicy).toHaveBeenCalledWith(body.title, body.content);
      expect(result).toEqual(mockDoc);
    });
  });

  describe('CookiePolicy endpoints', () => {
    const mockDoc = { id: 1, title: 'Cookie Policy', content: '{"root":{"type":"root","version":1,"children":[]}}' };

    it('should return cookie policy', async () => {
      jest.spyOn(service, 'getCookiePolicy').mockResolvedValueOnce(mockDoc as any);
      const result = await controller.getCookiePolicy();
      expect(service.getCookiePolicy).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should update cookie policy', async () => {
      const body = { title: 'Cookie Policy', content: '{"root":{"type":"root","version":1,"children":[]}}' };
      jest.spyOn(service, 'setCookiePolicy').mockResolvedValueOnce(mockDoc as any);
      const result = await controller.setCookiePolicy(body as any);
      expect(service.setCookiePolicy).toHaveBeenCalledWith(body.title, body.content);
      expect(result).toEqual(mockDoc);
    });
  });
});
