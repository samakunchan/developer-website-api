import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechStackDto } from './dto/create-tech-stack.dto';
import { CreateSocialLinkDto } from './dto/create-social-link.dto';
import { UpdatePersonalInfoDto } from './dto/update-personal-info.dto';
import * as sharp from 'sharp';
import * as path from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches the profile data for the presentation (matching ADMIN_EMAIL).
   */
  async getProfilePresentation() {
    const email = process.env.ADMIN_EMAIL;
    console.log(email);
    if (!email) {
      throw new BadRequestException('ADMIN_EMAIL environment variable is not defined');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        personalInfo: true,
        techStacks: true,
        socialLinks: true,
        image: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    return user;
  }

  /**
   * Fetches the complete profile data for a specific user.
   */
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        personalInfo: true,
        techStacks: true,
        socialLinks: true,
        image: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Updates personal information and user identity data.
   */
  async updatePersonalInfo(userId: number, dto: UpdatePersonalInfoDto) {
    const { fullName, ...personalInfoData } = dto;

    return await this.prisma.$transaction(async (tx) => {
      // Update basic user info (name)
      await tx.user.update({
        where: { id: userId },
        data: { name: fullName },
      });

      // Update or create detailed personal info
      await tx.personalInformation.upsert({
        where: { userId },
        create: {
          ...personalInfoData,
          userId,
        },
        update: personalInfoData,
      });

      return { success: true };
    });
  }

  /**
   * Adds a new tech stack item.
   */
  async addTechStack(userId: number, dto: CreateTechStackDto) {
    return await this.prisma.techStack.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  /**
   * Removes a tech stack item.
   */
  async removeTechStack(userId: number, id: number) {
    const item = await this.prisma.techStack.findUnique({ where: { id } });
    if (!item || item.userId !== userId) {
      throw new ForbiddenException('Not found or unauthorized');
    }

    return await this.prisma.techStack.delete({
      where: { id },
    });
  }

  /**
   * Adds a new social link.
   */
  async addSocialLink(userId: number, dto: CreateSocialLinkDto) {
    return await this.prisma.socialLink.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  /**
   * Removes a social link.
   */
  async removeSocialLink(userId: number, id: number) {
    const item = await this.prisma.socialLink.findUnique({ where: { id } });
    if (!item || item.userId !== userId) {
      throw new ForbiddenException('Not found or unauthorized');
    }

    return await this.prisma.socialLink.delete({
      where: { id },
    });
  }

  /**
   * Handles the profile photo upload, resizes/optimizes it via sharp, saves it to disk, and updates DB.
   */
  async updateAvatar(userId: number, file: Express.Multer.File, apiBaseUrl: string) {
    const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!VALID_FILE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Format non supporté. Utilisez JPG, PNG ou WebP.');
    }

    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Fichier trop lourd (max 2MB).');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { image: true },
    });

    const timestamp = Date.now();
    const storageDir = path.join(process.cwd(), 'uploads', 'me');
    await fs.mkdir(storageDir, { recursive: true });

    // Clean up existing avatar files from filesystem
    if (currentUser?.image) {
      const oldImage = currentUser.image;
      const getLocalPath = (url: string) => {
        try {
          const pathname = new URL(url).pathname;
          return path.join(process.cwd(), pathname);
        } catch {
          // If already relative
          const cleanPath = url.startsWith('/') ? url.substring(1) : url;
          return path.join(process.cwd(), cleanPath);
        }
      };

      const pathsToUnlink = [getLocalPath(oldImage.tiny), getLocalPath(oldImage.medium), getLocalPath(oldImage.raw)];

      for (const p of pathsToUnlink) {
        await fs.unlink(p).catch(() => undefined);
      }
    }

    const tinyFilename = `avatar-${userId}-${timestamp}-tiny.webp`;
    const mediumFilename = `avatar-${userId}-${timestamp}-medium.webp`;
    const rawFilename = `avatar-${userId}-${timestamp}-raw.webp`;

    const tinyPath = path.join(storageDir, tinyFilename);
    const mediumPath = path.join(storageDir, mediumFilename);
    const rawPath = path.join(storageDir, rawFilename);

    await Promise.all([
      sharp(file.buffer).resize(32, 32, { fit: 'cover' }).toFormat('webp').toFile(tinyPath),
      sharp(file.buffer).resize(80, 80, { fit: 'cover' }).toFormat('webp').toFile(mediumPath),
      sharp(file.buffer).toFormat('webp', { quality: 80 }).toFile(rawPath),
    ]);

    const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    const dbPaths = {
      tiny: `${baseUrl}/uploads/me/${tinyFilename}`,
      medium: `${baseUrl}/uploads/me/${mediumFilename}`,
      raw: `${baseUrl}/uploads/me/${rawFilename}`,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        image: {
          upsert: {
            create: dbPaths,
            update: dbPaths,
          },
        },
      },
    });

    return { success: true, urls: dbPaths };
  }
}
