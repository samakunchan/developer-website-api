import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus } from '@prisma/client';
import * as sharp from 'sharp';
import * as path from 'path';
import { promises as fs } from 'fs';
import { DocumentsService } from '../documents/documents.service';
import { url } from 'inspector';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService, private readonly documentsService: DocumentsService) {}

  /**
   * Safe helper to extract URL and delete file from S3 or filesystem
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

    const otherImages = await this.prisma.projectImage.findMany({
      where: {
        projectId: { not: image.projectId },
      },
    });

    const isMediumShared = otherImages.some((img: any) => extractUrl(img.medium) === mediumUrl);
    const isRawShared = otherImages.some((img: any) => extractUrl(img.raw) === rawUrl);

    const getS3KeyOrLocalPath = (url: string | null) => {
      if (!url) return null;
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
        const cleanPath = url.startsWith('/') ? url.substring(1) : url;
        return { type: 'local', value: path.join(process.cwd(), cleanPath) };
      }
    };

    const targets = [];
    if (mediumUrl && !isMediumShared) {
      targets.push(getS3KeyOrLocalPath(mediumUrl));
    }
    if (rawUrl && !isRawShared) {
      targets.push(getS3KeyOrLocalPath(rawUrl));
    }

    const cleanTargets = targets.filter(Boolean) as {
      type: string;
      value: string;
    }[];

    for (const target of cleanTargets) {
      if (target.type === 's3') {
        await this.documentsService.deleteFile(target.value).catch(() => undefined);
      } else {
        await fs.unlink(target.value).catch(() => undefined);
      }
    }
  }

  /**
   * Fetches all projects, ordered by createdAt descending
   */
  async getProjects() {
    return await this.prisma.project.findMany({
      include: { image: true, projectUrl: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetches projects filtered by status, ordered by createdAt descending
   */
  async getProjectsByStatus(status: ProjectStatus) {
    return await this.prisma.project.findMany({
      where: { status },
      include: { image: true, projectUrl: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetches a project by its ID
   */
  async getProjectById(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { image: true, projectUrl: true },
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
      include: { image: true, projectUrl: true },
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
    const { image, projectUrl, ...projectData } = dto;

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
        projectUrl:
          projectUrl != null && projectUrl.url
            ? {
                create: {
                  url: projectUrl.url as any,
                  mode: projectUrl.mode as any,
                  isActive: projectUrl.isActive as any,
                },
              }
            : undefined,
      },
      include: { image: true, projectUrl: true },
    });
  }

  /**
   * Updates an existing project
   */
  async updateProject(id: number, dto: UpdateProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { id },
      include: { image: true, projectUrl: true },
    });
    if (!existing) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const { image, ...projectData } = dto;

    // Handle slug change when switching status to archived
    if (projectData.status === ProjectStatus.archived && existing.status !== ProjectStatus.archived) {
      const baseSlug = projectData.slug || existing.slug;
      const archivedSuffix = `-${id}-archived`;
      if (!baseSlug.endsWith(archivedSuffix)) {
        projectData.slug = `${baseSlug}${archivedSuffix}`;
      } else {
        projectData.slug = baseSlug;
      }
    }

    // Handle image cleanup and updates
    let imageUpdateAction: any = undefined;
    let projectUrlUpdateAction: any = undefined;

    if (image === null) {
      // Explicit deletion of the image
      if (existing.image) {
        await this.cleanupFiles(existing.image);
        await this.prisma.projectImage.delete({
          where: { projectId: id },
        });
      }
    } else if (image) {
      const existingMedium = existing.image?.medium as any;
      const existingRaw = existing.image?.raw as any;

      const isUrlSame: boolean | null =
        existing.image && existingMedium?.url === image.medium.url && existingRaw?.url === image.raw.url;

      const isSameImage: boolean | null =
        isUrlSame && existingMedium?.alt === image.medium.alt && existingRaw?.alt === image.raw.alt;

      if (!isSameImage) {
        // Only clean up previous files if the URL has actually changed!
        if (existing.image && !isUrlSame) {
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
    }
    if (projectData.projectUrl != null) {
      projectUrlUpdateAction = {
        upsert: {
          create: {
            url: projectData.projectUrl.url as any,
            mode: projectData.projectUrl.mode as any,
            isActive: projectData.projectUrl.isActive as any,
          },
          update: {
            url: projectData.projectUrl.url as any,
            mode: projectData.projectUrl.mode as any,
            isActive: projectData.projectUrl.isActive as any,
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
        projectUrl: projectUrlUpdateAction,
      },
      include: { image: true, projectUrl: true },
    });
  }

  /**
   * Deletes a project
   */
  async deleteProject(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { image: true, projectUrl: true },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (project.status !== ProjectStatus.archived) {
      throw new BadRequestException('Only archived projects can be deleted');
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
      include: { image: true, projectUrl: true },
    });
  }

  /**
   * Processes an uploaded banner image, resizes, and saves WebP versions to Garage S3
   */
  async uploadImage(file: Express.Multer.File, identifier?: string) {
    const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!VALID_FILE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Format non supporté. Utilisez JPG, PNG ou WebP.');
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Fichier trop lourd (max 5MB).');
    }

    const idKey = identifier || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const mediumFilename = `projects/project-${idKey}-medium.webp`;
    const rawFilename = `projects/project-${idKey}-raw.webp`;

    const [mediumBuffer, rawBuffer] = await Promise.all([
      sharp(file.buffer).resize(1200, 800, { fit: 'cover' }).toFormat('webp', { quality: 80 }).toBuffer(),
      sharp(file.buffer).toFormat('webp', { quality: 90 }).toBuffer(),
    ]);

    const [mediumUrl, rawUrl] = await Promise.all([
      this.documentsService.uploadFile(mediumFilename, mediumBuffer, 'image/webp'),
      this.documentsService.uploadFile(rawFilename, rawBuffer, 'image/webp'),
    ]);

    return {
      success: true,
      urls: {
        medium: {
          url: mediumUrl,
          alt: '',
        },
        raw: {
          url: rawUrl,
          alt: '',
        },
      },
    };
  }
}
