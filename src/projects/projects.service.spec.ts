import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectCategory, ProjectStatus } from '@prisma/client';
import { DocumentsService } from '../documents/documents.service';

// Mock minio
jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({})),
}));

// Mock sharp and fs
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    toFormat: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue({}),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from([1, 2, 3])),
  }));
});

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const mockProject = {
    id: 1,
    slug: 'test-project',
    title: 'Test Project',
    description: 'Test Description',
    category: ProjectCategory.web,
    categoryLabel: 'Web',
    caseStudyNumber: '1',
    techIcons: ['react', 'node'],
    techStack: [{ name: 'React', icon: 'react' }],
    features: [{ icon: 'icon', title: 'Feature 1', description: 'Desc 1' }],
    isFeatured: false,
    userId: 1,
    status: ProjectStatus.draft,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: {
      id: 1,
      medium: {
        url: 'http://localhost:3002/uploads/projects/medium.webp',
        alt: '',
      },
      raw: { url: 'http://localhost:3002/uploads/projects/raw.webp', alt: '' },
      projectId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findMany: jest.fn().mockResolvedValue([mockProject]),
              findUnique: jest.fn().mockResolvedValue(mockProject),
              create: jest.fn().mockResolvedValue(mockProject),
              update: jest.fn().mockResolvedValue(mockProject),
              delete: jest.fn().mockResolvedValue(mockProject),
            },
            projectImage: {
              findMany: jest.fn().mockResolvedValue([]),
              delete: jest.fn().mockResolvedValue({}),
            },
          },
        },
        {
          provide: DocumentsService,
          useValue: {
            uploadFile: jest
              .fn()
              .mockImplementation((key) => Promise.resolve(`http://papanguesoft.web.garage.localhost:3902/${key}`)),
            deleteFile: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProjects', () => {
    it('should return all projects', async () => {
      const result = await service.getProjects();
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        include: { image: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockProject]);
    });
  });

  describe('getProjectsByStatus', () => {
    it('should return projects filtered by status', async () => {
      const result = await service.getProjectsByStatus(ProjectStatus.draft);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { status: ProjectStatus.draft },
        include: { image: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockProject]);
    });
  });

  describe('getProjectById', () => {
    it('should return project if found', async () => {
      const result = await service.getProjectById(1);
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { image: true },
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce(null);
      await expect(service.getProjectById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProjectBySlug', () => {
    it('should return project if found', async () => {
      const result = await service.getProjectBySlug('test-project');
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-project' },
        include: { image: true },
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce(null);
      await expect(service.getProjectBySlug('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const createDto = {
        slug: 'new-project',
        title: 'New Project',
        description: 'New Desc',
        category: ProjectCategory.web,
        categoryLabel: 'Web App',
        caseStudyNumber: '2',
        techIcons: ['vue'],
        techStack: [{ name: 'Vue', icon: 'vue' }],
        features: [{ icon: 'icon2', title: 'Feature 2', description: 'Desc 2' }],
        isFeatured: false,
        status: ProjectStatus.draft,
        image: {
          medium: {
            url: 'http://localhost:3002/uploads/projects/medium.webp',
            alt: '',
          },
          raw: {
            url: 'http://localhost:3002/uploads/projects/raw.webp',
            alt: '',
          },
        },
      };

      const result = await service.createProject(1, createDto);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'new-project',
          title: 'New Project',
          userId: 1,
          image: {
            create: {
              medium: createDto.image.medium,
              raw: createDto.image.raw,
            },
          },
        }),
        include: { image: true },
      });
      expect(result).toEqual(mockProject);
    });
  });

  describe('updateProject', () => {
    const updateDto = {
      title: 'Updated Title',
    };

    it('should update project fields', async () => {
      const result = await service.updateProject(1, updateDto);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          title: 'Updated Title',
        }),
        include: { image: true },
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project to update is not found', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce(null);
      await expect(service.updateProject(999, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should handle image removal if image is null', async () => {
      await service.updateProject(1, { image: null });
      expect(prisma.projectImage.delete).toHaveBeenCalledWith({
        where: { projectId: 1 },
      });
    });

    it('should change slug to target-pattern if status is updated to archived', async () => {
      const draftProject = { ...mockProject, status: ProjectStatus.draft, slug: 'my-cool-project' };
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce(draftProject);

      await service.updateProject(1, { status: ProjectStatus.archived });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: ProjectStatus.archived,
          slug: 'my-cool-project-1-archived',
        }),
        include: { image: true },
      });
    });

    it('should not double-append the archived suffix if slug already ends with it', async () => {
      const draftProject = { ...mockProject, status: ProjectStatus.draft, slug: 'my-cool-project-1-archived' };
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce(draftProject);

      await service.updateProject(1, { status: ProjectStatus.archived });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: ProjectStatus.archived,
          slug: 'my-cool-project-1-archived',
        }),
        include: { image: true },
      });
    });

    it('should not change slug to archived pattern if status is not changed to archived', async () => {
      const draftProject = { ...mockProject, status: ProjectStatus.draft, slug: 'my-cool-project' };
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce(draftProject);

      await service.updateProject(1, { status: ProjectStatus.published });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: ProjectStatus.published,
        }),
        include: { image: true },
      });
    });
  });

  describe('deleteProject', () => {
    it('should delete project if its status is archived', async () => {
      const archivedProject = { ...mockProject, status: ProjectStatus.archived };
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce(archivedProject);
      const result = await service.deleteProject(1);
      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw BadRequestException if project status is not archived', async () => {
      const draftProject = { ...mockProject, status: ProjectStatus.draft };
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce(draftProject);
      await expect(service.deleteProject(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if project to delete is not found', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce(null);
      await expect(service.deleteProject(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleProjectFeatured', () => {
    it('should toggle isFeatured status', async () => {
      const result = await service.toggleProjectFeatured(1);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isFeatured: !mockProject.isFeatured },
        include: { image: true },
      });
      expect(result).toEqual(mockProject);
    });
  });

  describe('uploadImage', () => {
    it('should reject unsupported formats', async () => {
      const file = {
        mimetype: 'image/gif',
        size: 1000,
        buffer: Buffer.from([]),
      } as Express.Multer.File;

      await expect(service.uploadImage(file)).rejects.toThrow(BadRequestException);
    });

    it('should reject files larger than 5MB', async () => {
      const file = {
        mimetype: 'image/png',
        size: 6 * 1024 * 1024,
        buffer: Buffer.from([]),
      } as Express.Multer.File;

      await expect(service.uploadImage(file)).rejects.toThrow(BadRequestException);
    });

    it('should process and return image urls', async () => {
      const file = {
        mimetype: 'image/png',
        size: 1 * 1024 * 1024,
        buffer: Buffer.from([1, 2, 3]),
      } as Express.Multer.File;

      const result = await service.uploadImage(file);
      expect(result.success).toBe(true);
      expect(result.urls.medium.url).toContain('papanguesoft.web.garage.localhost:3902/projects/project-temp-');
      expect(result.urls.raw.url).toContain('papanguesoft.web.garage.localhost:3902/projects/project-temp-');
    });

    it('should process and return image urls using a custom identifier', async () => {
      const file = {
        mimetype: 'image/png',
        size: 1 * 1024 * 1024,
        buffer: Buffer.from([1, 2, 3]),
      } as Express.Multer.File;

      const result = await service.uploadImage(file, 'test-project-123');
      expect(result.success).toBe(true);
      expect(result.urls.medium.url).toContain(
        'papanguesoft.web.garage.localhost:3902/projects/project-test-project-123-medium.webp',
      );
      expect(result.urls.raw.url).toContain('papanguesoft.web.garage.localhost:3902/projects/project-test-project-123-raw.webp');
    });
  });
});
