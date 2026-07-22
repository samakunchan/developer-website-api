import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import * as sharp from 'sharp';
import * as path from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Safe helper to extract URL and delete file from filesystem
   */
  private async cleanupFiles(image: any) {
    if (!image) return;

    const extractUrl = (field: any) => {
      if (typeof field === 'string') return field;
      if (field && typeof field === 'object' && 'url' in field) {
        return field.url;
      }
      return null;
    };

    const mediumUrl = extractUrl(image.medium);
    const rawUrl = extractUrl(image.raw);

    const getLocalPath = (url: string | null) => {
      if (!url) return null;
      try {
        const pathname = new URL(url).pathname;
        return path.join(process.cwd(), pathname);
      } catch {
        const cleanPath = url.startsWith('/') ? url.substring(1) : url;
        return path.join(process.cwd(), cleanPath);
      }
    };

    const paths = [getLocalPath(mediumUrl), getLocalPath(rawUrl)].filter(Boolean) as string[];

    for (const p of paths) {
      await fs.unlink(p).catch(() => undefined);
    }
  }

  /**
   * Fetches all projects, ordered by createdAt descending
   */
  async getProjects() {
    return await this.prisma.project.findMany({
      include: { image: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetches a project by its ID
   */
  async getProjectById(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { image: true },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  /**
   * Fetches a project by its unique slug
   */
  async getProjectBySlug(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      include: { image: true },
    });
    if (!project) {
      throw new NotFoundException(`Project with slug "${slug}" not found`);
    }
    return project;
  }

  /**
   * Creates a new project
   */
  async createProject(userId: number, dto: CreateProjectDto) {
    const { image, ...projectData } = dto;

    return await this.prisma.project.create({
      data: {
        ...projectData,
        description: projectData.description ?? '',
        categoryLabel: projectData.categoryLabel ?? '',
        techStack: projectData.techStack as any,
        features: projectData.features as any,
        userId,
        image: image
          ? {
              create: {
                medium: image.medium as any,
                raw: image.raw as any,
              },
            }
          : undefined,
      },
      include: { image: true },
    });
  }

  /**
   * Updates an existing project
   */
  async updateProject(id: number, dto: UpdateProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { id },
      include: { image: true },
    });
    if (!existing) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const { image, ...projectData } = dto;

    // Handle image cleanup and updates
    let imageUpdateAction: any = undefined;

    if (image === null) {
      // Explicit deletion of the image
      if (existing.image) {
        await this.cleanupFiles(existing.image);
        await this.prisma.projectImage.delete({
          where: { projectId: id },
        });
      }
    } else if (image) {
      // Clean up previous files if any exist
      if (existing.image) {
        await this.cleanupFiles(existing.image);
      }
      imageUpdateAction = {
        upsert: {
          create: {
            medium: image.medium as any,
            raw: image.raw as any,
          },
          update: {
            medium: image.medium as any,
            raw: image.raw as any,
          },
        },
      };
    }

    return await this.prisma.project.update({
      where: { id },
      data: {
        ...projectData,
        techStack: projectData.techStack ? (projectData.techStack as any) : undefined,
        features: projectData.features ? (projectData.features as any) : undefined,
        image: imageUpdateAction,
      },
      include: { image: true },
    });
  }

  /**
   * Deletes a project
   */
  async deleteProject(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { image: true },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (project.image) {
      await this.cleanupFiles(project.image);
    }

    return await this.prisma.project.delete({
      where: { id },
    });
  }

  /**
   * Toggles the "featured" status of a project
   */
  async toggleProjectFeatured(id: number) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return await this.prisma.project.update({
      where: { id },
      data: { isFeatured: !project.isFeatured },
      include: { image: true },
    });
  }

  /**
   * Processes a uploaded banner image, resizes, and saves WebP versions
   */
  async uploadImage(file: Express.Multer.File, apiBaseUrl: string) {
    const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!VALID_FILE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Format non supporté. Utilisez JPG, PNG ou WebP.');
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Fichier trop lourd (max 5MB).');
    }

    const timestamp = Date.now();
    const storageDir = path.join(process.cwd(), 'uploads', 'projects');
    await fs.mkdir(storageDir, { recursive: true });

    const mediumFilename = `project-${timestamp}-medium.webp`;
    const rawFilename = `project-${timestamp}-raw.webp`;

    const mediumPath = path.join(storageDir, mediumFilename);
    const rawPath = path.join(storageDir, rawFilename);

    await Promise.all([
      sharp(file.buffer).resize(1200, 800, { fit: 'cover' }).toFormat('webp', { quality: 80 }).toFile(mediumPath),
      sharp(file.buffer).toFormat('webp', { quality: 90 }).toFile(rawPath),
    ]);

    const baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

    return {
      success: true,
      urls: {
        medium: {
          url: `${baseUrl}/uploads/projects/${mediumFilename}`,
          alt: '',
        },
        raw: {
          url: `${baseUrl}/uploads/projects/${rawFilename}`,
          alt: '',
        },
      },
    };
  }
}
