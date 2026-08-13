import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTechStackDto } from './dto/create-tech-stack.dto';
import { CreateSocialLinkDto } from './dto/create-social-link.dto';
import { UpdatePersonalInfoDto } from './dto/update-personal-info.dto';
import * as sharp from 'sharp';
import * as path from 'path';
import { promises as fs } from 'fs';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService, private readonly documentsService: DocumentsService) {}

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
  async updateAvatar(userId: number, file: Express.Multer.File) {
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

    // Clean up existing avatar files from filesystem or S3
    if (currentUser?.image) {
      const oldImage = currentUser.image;
      const getS3KeyOrLocalPath = (url: string) => {
        try {
          const parsedUrl = new URL(url);
          const endpoint = process.env.S3_PUBLIC_ENDPOINT || 'web.garage.localhost';
          if (parsedUrl.hostname.includes(endpoint)) {
            const pathname = parsedUrl.pathname;
            const key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
            return { type: 's3', value: key };
          } else {
            const pathname = parsedUrl.pathname;
            return { type: 'local', value: path.join(process.cwd(), pathname) };
          }
        } catch {
          // If already relative
          const cleanPath = url.startsWith('/') ? url.substring(1) : url;
          return { type: 'local', value: path.join(process.cwd(), cleanPath) };
        }
      };

      const targets = [oldImage.tiny, oldImage.medium, oldImage.raw].map(getS3KeyOrLocalPath);

      for (const target of targets) {
        if (target.type === 's3') {
          await this.documentsService.deleteFile(target.value).catch(() => undefined);
        } else {
          await fs.unlink(target.value).catch(() => undefined);
        }
      }
    }

    const tinyFilename = `avatars/avatar-${userId}-${timestamp}-tiny.webp`;
    const mediumFilename = `avatars/avatar-${userId}-${timestamp}-medium.webp`;
    const rawFilename = `avatars/avatar-${userId}-${timestamp}-raw.webp`;

    const [tinyBuffer, mediumBuffer, rawBuffer] = await Promise.all([
      sharp(file.buffer).resize(32, 32, { fit: 'cover' }).toFormat('webp').toBuffer(),
      sharp(file.buffer).resize(80, 80, { fit: 'cover' }).toFormat('webp').toBuffer(),
      sharp(file.buffer).toFormat('webp', { quality: 80 }).toBuffer(),
    ]);

    const [tinyUrl, mediumUrl, rawUrl] = await Promise.all([
      this.documentsService.uploadFile(tinyFilename, tinyBuffer, 'image/webp'),
      this.documentsService.uploadFile(mediumFilename, mediumBuffer, 'image/webp'),
      this.documentsService.uploadFile(rawFilename, rawBuffer, 'image/webp'),
    ]);

    const dbPaths = {
      tiny: tinyUrl,
      medium: mediumUrl,
      raw: rawUrl,
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
