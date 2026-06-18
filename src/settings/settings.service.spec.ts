import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { Theme } from '@prisma/client';
import { ThemeNotFoundException } from './exceptions/theme-not-found.exception';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaService;

  const mockSettings = {
    id: 1,
    theme: Theme.forest,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: {
            settings: {
              findFirst: jest.fn().mockResolvedValue(mockSettings),
              upsert: jest.fn().mockResolvedValue(mockSettings),
            },
            legalMentions: {
              findFirst: jest.fn(),
              upsert: jest.fn(),
            },
            cGU: {
              findFirst: jest.fn(),
              upsert: jest.fn(),
            },
            privacyPolicy: {
              findFirst: jest.fn(),
              upsert: jest.fn(),
            },
            cookiePolicy: {
              findFirst: jest.fn(),
              upsert: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTheme', () => {
    it('should return the theme from settings in DB if it exists', async () => {
      const result = await service.getTheme();
      expect(prisma.settings.findFirst).toHaveBeenCalled();
      expect(result).toBe(Theme.forest);
    });

    it('should return light theme if no settings exist in DB', async () => {
      jest.spyOn(prisma.settings, 'findFirst').mockResolvedValueOnce(null);
      const result = await service.getTheme();
      expect(result).toBe(Theme.light);
    });

    it('should return light theme if findFirst throws an error', async () => {
      jest.spyOn(prisma.settings, 'findFirst').mockRejectedValueOnce(new Error('DB error'));
      const result = await service.getTheme();
      expect(result).toBe(Theme.light);
    });
  });

  describe('setTheme', () => {
    it('should upsert the theme with ID 1 and return success', async () => {
      const result = await service.setTheme(Theme.ocean);
      expect(prisma.settings.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: { theme: Theme.ocean },
        create: { id: 1, theme: Theme.ocean },
      });
      expect(result).toEqual({ success: true, theme: Theme.forest });
    });

    it('should throw ThemeNotFoundException if an invalid theme is provided', async () => {
      await expect(service.setTheme('invalid-theme' as any)).rejects.toThrow(ThemeNotFoundException);
    });

    it('should throw InternalServerErrorException if upsert throws an error', async () => {
      jest.spyOn(prisma.settings, 'upsert').mockRejectedValueOnce(new Error('DB error'));

      await expect(service.setTheme(Theme.ocean)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('LegalMentions methods', () => {
    const mockDoc = { id: 1, title: 'Mentions Légales', content: { text: 'test' } };

    it('should get legal mentions', async () => {
      jest.spyOn(prisma.legalMentions, 'findFirst').mockResolvedValueOnce(mockDoc as any);
      const result = await service.getLegalMentions();
      expect(prisma.legalMentions.findFirst).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should throw InternalServerErrorException if findFirst fails', async () => {
      jest.spyOn(prisma.legalMentions, 'findFirst').mockRejectedValueOnce(new Error('DB error'));
      await expect(service.getLegalMentions()).rejects.toThrow(InternalServerErrorException);
    });

    it('should set legal mentions', async () => {
      jest.spyOn(prisma.legalMentions, 'upsert').mockResolvedValueOnce(mockDoc as any);
      const result = await service.setLegalMentions(mockDoc.title, mockDoc.content);
      expect(prisma.legalMentions.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: { title: mockDoc.title, content: mockDoc.content },
        create: { id: 1, title: mockDoc.title, content: mockDoc.content },
      });
      expect(result).toEqual(mockDoc);
    });

    it('should throw InternalServerErrorException if upsert fails', async () => {
      jest.spyOn(prisma.legalMentions, 'upsert').mockRejectedValueOnce(new Error('DB error'));
      await expect(service.setLegalMentions('title', {})).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('CGU methods', () => {
    const mockDoc = { id: 1, title: 'CGU', content: { text: 'test' } };

    it('should get cgu', async () => {
      jest.spyOn(prisma.cGU, 'findFirst').mockResolvedValueOnce(mockDoc as any);
      const result = await service.getCGU();
      expect(prisma.cGU.findFirst).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should throw InternalServerErrorException if findFirst fails', async () => {
      jest.spyOn(prisma.cGU, 'findFirst').mockRejectedValueOnce(new Error('DB error'));
      await expect(service.getCGU()).rejects.toThrow(InternalServerErrorException);
    });

    it('should set cgu', async () => {
      jest.spyOn(prisma.cGU, 'upsert').mockResolvedValueOnce(mockDoc as any);
      const result = await service.setCGU(mockDoc.title, mockDoc.content);
      expect(prisma.cGU.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: { title: mockDoc.title, content: mockDoc.content },
        create: { id: 1, title: mockDoc.title, content: mockDoc.content },
      });
      expect(result).toEqual(mockDoc);
    });

    it('should throw InternalServerErrorException if upsert fails', async () => {
      jest.spyOn(prisma.cGU, 'upsert').mockRejectedValueOnce(new Error('DB error'));
      await expect(service.setCGU('title', {})).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('PrivacyPolicy methods', () => {
    const mockDoc = { id: 1, title: 'Privacy Policy', content: { text: 'test' } };

    it('should get privacy policy', async () => {
      jest.spyOn(prisma.privacyPolicy, 'findFirst').mockResolvedValueOnce(mockDoc as any);
      const result = await service.getPrivacyPolicy();
      expect(prisma.privacyPolicy.findFirst).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should throw InternalServerErrorException if findFirst fails', async () => {
      jest.spyOn(prisma.privacyPolicy, 'findFirst').mockRejectedValueOnce(new Error('DB error'));
      await expect(service.getPrivacyPolicy()).rejects.toThrow(InternalServerErrorException);
    });

    it('should set privacy policy', async () => {
      jest.spyOn(prisma.privacyPolicy, 'upsert').mockResolvedValueOnce(mockDoc as any);
      const result = await service.setPrivacyPolicy(mockDoc.title, mockDoc.content);
      expect(prisma.privacyPolicy.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: { title: mockDoc.title, content: mockDoc.content },
        create: { id: 1, title: mockDoc.title, content: mockDoc.content },
      });
      expect(result).toEqual(mockDoc);
    });

    it('should throw InternalServerErrorException if upsert fails', async () => {
      jest.spyOn(prisma.privacyPolicy, 'upsert').mockRejectedValueOnce(new Error('DB error'));
      await expect(service.setPrivacyPolicy('title', {})).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('CookiePolicy methods', () => {
    const mockDoc = { id: 1, title: 'Cookie Policy', content: { text: 'test' } };

    it('should get cookie policy', async () => {
      jest.spyOn(prisma.cookiePolicy, 'findFirst').mockResolvedValueOnce(mockDoc as any);
      const result = await service.getCookiePolicy();
      expect(prisma.cookiePolicy.findFirst).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should throw InternalServerErrorException if findFirst fails', async () => {
      jest.spyOn(prisma.cookiePolicy, 'findFirst').mockRejectedValueOnce(new Error('DB error'));
      await expect(service.getCookiePolicy()).rejects.toThrow(InternalServerErrorException);
    });

    it('should set cookie policy', async () => {
      jest.spyOn(prisma.cookiePolicy, 'upsert').mockResolvedValueOnce(mockDoc as any);
      const result = await service.setCookiePolicy(mockDoc.title, mockDoc.content);
      expect(prisma.cookiePolicy.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: { title: mockDoc.title, content: mockDoc.content },
        create: { id: 1, title: mockDoc.title, content: mockDoc.content },
      });
      expect(result).toEqual(mockDoc);
    });

    it('should throw InternalServerErrorException if upsert fails', async () => {
      jest.spyOn(prisma.cookiePolicy, 'upsert').mockRejectedValueOnce(new Error('DB error'));
      await expect(service.setCookiePolicy('title', {})).rejects.toThrow(InternalServerErrorException);
    });
  });
});
