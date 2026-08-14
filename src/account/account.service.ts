import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { NoMoreUserAcceptedException } from './exceptions/no-more-user-accepted.exception';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  private getAppUrl(): string {
    if (process.env.APP_URL_STAGING) {
      return process.env.APP_URL_STAGING;
    }
    if (process.env.APP_URL_PROD) {
      return process.env.APP_URL_PROD;
    }
    return process.env.APP_URL_DEV || process.env.APP_URL || `http://localhost:${process.env.APP_PORT || 3000}`;
  }

  async register(dto: RegisterDto) {
    const userCount = await this.prisma.user.count();
    if (userCount > 0) {
      throw new NoMoreUserAcceptedException();
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const appUrl = this.getAppUrl();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name || null,
        role: Role.admin,
        image: {
          create: {
            tiny: `${appUrl}/shared/me/me-tiny.webp`,
            medium: `${appUrl}/shared/me/me-medium.webp`,
            raw: `${appUrl}/shared/me/me-raw.webp`,
          },
        },
      },
      include: {
        image: true,
        personalInfo: true,
      },
    });

    // Also initialize default settings if not present
    const settingsCount = await this.prisma.settings.count();
    if (settingsCount === 0) {
      await this.prisma.settings.create({
        data: {
          id: 1,
          theme: 'light',
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      image: user.image,
      personalInfo: user.personalInfo,
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        image: true,
        personalInfo: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      image: user.image,
      personalInfo: user.personalInfo,
    };
  }
}
