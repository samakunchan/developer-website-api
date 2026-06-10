import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Theme } from '@prisma/client';
import { ThemeNotFoundException } from './exceptions/theme-not-found.exception';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTheme(): Promise<Theme> {
    try {
      const settings = await this.prisma.settings.findFirst();
      return settings?.theme || Theme.light;
    } catch (error) {
      console.error('Failed to fetch theme from DB:', error);
      return Theme.light;
    }
  }

  async setTheme(theme: Theme): Promise<{ success: boolean; theme: Theme }> {
    if (!Object.values(Theme).includes(theme)) {
      throw new ThemeNotFoundException();
    }
    try {
      const updated = await this.prisma.settings.upsert({
        where: { id: 1 },
        update: { theme },
        create: { id: 1, theme },
      });
      return { success: true, theme: updated.theme };
    } catch (error) {
      console.error('Failed to update theme in DB:', error);
      throw new InternalServerErrorException('Failed to update theme');
    }
  }
}
