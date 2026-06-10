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
      jest
        .spyOn(prisma.settings, 'findFirst')
        .mockRejectedValueOnce(new Error('DB error'));
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
      await expect(service.setTheme('invalid-theme' as any)).rejects.toThrow(
        ThemeNotFoundException,
      );
    });

    it('should throw InternalServerErrorException if upsert throws an error', async () => {
      jest
        .spyOn(prisma.settings, 'upsert')
        .mockRejectedValueOnce(new Error('DB error'));

      await expect(service.setTheme(Theme.ocean)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
