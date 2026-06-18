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

  // Legal Mentions
  async getLegalMentions() {
    try {
      return await this.prisma.legalMentions.findFirst();
    } catch (error) {
      console.error('Failed to fetch legal mentions from DB:', error);
      throw new InternalServerErrorException('Failed to fetch legal mentions');
    }
  }

  async setLegalMentions(title: string, content: any) {
    try {
      return await this.prisma.legalMentions.upsert({
        where: { id: 1 },
        update: { title, content },
        create: { id: 1, title, content },
      });
    } catch (error) {
      console.error('Failed to update legal mentions in DB:', error);
      throw new InternalServerErrorException('Failed to update legal mentions');
    }
  }

  // CGU
  async getCGU() {
    try {
      return await this.prisma.cGU.findFirst();
    } catch (error) {
      console.error('Failed to fetch CGU from DB:', error);
      throw new InternalServerErrorException('Failed to fetch CGU');
    }
  }

  async setCGU(title: string, content: any) {
    try {
      return await this.prisma.cGU.upsert({
        where: { id: 1 },
        update: { title, content },
        create: { id: 1, title, content },
      });
    } catch (error) {
      console.error('Failed to update CGU in DB:', error);
      throw new InternalServerErrorException('Failed to update CGU');
    }
  }

  // Privacy Policy
  async getPrivacyPolicy() {
    try {
      return await this.prisma.privacyPolicy.findFirst();
    } catch (error) {
      console.error('Failed to fetch privacy policy from DB:', error);
      throw new InternalServerErrorException('Failed to fetch privacy policy');
    }
  }

  async setPrivacyPolicy(title: string, content: any) {
    try {
      return await this.prisma.privacyPolicy.upsert({
        where: { id: 1 },
        update: { title, content },
        create: { id: 1, title, content },
      });
    } catch (error) {
      console.error('Failed to update privacy policy in DB:', error);
      throw new InternalServerErrorException('Failed to update privacy policy');
    }
  }

  // Cookie Policy
  async getCookiePolicy() {
    try {
      return await this.prisma.cookiePolicy.findFirst();
    } catch (error) {
      console.error('Failed to fetch cookie policy from DB:', error);
      throw new InternalServerErrorException('Failed to fetch cookie policy');
    }
  }

  async setCookiePolicy(title: string, content: any) {
    try {
      return await this.prisma.cookiePolicy.upsert({
        where: { id: 1 },
        update: { title, content },
        create: { id: 1, title, content },
      });
    } catch (error) {
      console.error('Failed to update cookie policy in DB:', error);
      throw new InternalServerErrorException('Failed to update cookie policy');
    }
  }
}
