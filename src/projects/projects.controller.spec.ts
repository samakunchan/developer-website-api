import { Test, TestingModule } from '@nestjs/testing';

// Mock jose module to prevent ESM import issues in Jest
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('signed-token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: {
      sub: '1',
      email: 'test@test.com',
      role: 'admin',
      name: 'Sama Test',
    },
  }),
}));

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ApiAuthService } from '../auth/api-auth.service';
import { ProjectCategory, ProjectStatus } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockProject = {
    id: 1,
    slug: 'test-project',
    title: 'Test Project',
    description: 'Test Description',
    category: ProjectCategory.web,
    categoryLabel: 'Web',
    caseStudyNumber: '1',
    techIcons: ['react'],
    techStack: [{ name: 'React', icon: 'react' }],
    features: [{ icon: 'icon', title: 'Feature 1', description: 'Desc 1' }],
    isFeatured: false,
    userId: 1,
    status: ProjectStatus.draft,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            getProjects: jest.fn().mockResolvedValue([mockProject]),
            getProjectById: jest.fn().mockResolvedValue(mockProject),
            getProjectBySlug: jest.fn().mockResolvedValue(mockProject),
            createProject: jest.fn().mockResolvedValue(mockProject),
            updateProject: jest.fn().mockResolvedValue(mockProject),
            deleteProject: jest.fn().mockResolvedValue(mockProject),
            toggleProjectFeatured: jest.fn().mockResolvedValue(mockProject),
            uploadImage: jest.fn().mockResolvedValue({
              success: true,
              urls: {
                medium: { url: 'http://localhost/med.webp', alt: '' },
                raw: { url: 'http://localhost/raw.webp', alt: '' },
              },
            }),
          },
        },
        {
          provide: ApiAuthService,
          useValue: {
            verifyToken: jest.fn().mockResolvedValue({
              id: 1,
              email: 'test@test.com',
              role: 'admin',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProjects', () => {
    it('should call service.getProjects', async () => {
      const result = await controller.getProjects();
      expect(service.getProjects).toHaveBeenCalled();
      expect(result).toEqual([mockProject]);
    });
  });

  describe('getProjectById', () => {
    it('should call service.getProjectById', async () => {
      const result = await controller.getProjectById(1);
      expect(service.getProjectById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProject);
    });
  });

  describe('getProjectBySlug', () => {
    it('should call service.getProjectBySlug', async () => {
      const result = await controller.getProjectBySlug('test-project');
      expect(service.getProjectBySlug).toHaveBeenCalledWith('test-project');
      expect(result).toEqual(mockProject);
    });
  });

  describe('createProject', () => {
    it('should call service.createProject with req.user.id and body', async () => {
      const createDto: CreateProjectDto = {
        slug: 'new-project',
        title: 'New Project',
        category: ProjectCategory.web,
        techIcons: [],
        techStack: [],
        features: [],
      };
      const req = { user: { id: 1 } } as any;

      const result = await controller.createProject(req, createDto);
      expect(service.createProject).toHaveBeenCalledWith(1, createDto);
      expect(result).toEqual(mockProject);
    });
  });

  describe('updateProject', () => {
    it('should call service.updateProject with id and body', async () => {
      const updateDto: UpdateProjectDto = {
        title: 'Updated title',
      };

      const result = await controller.updateProject(1, updateDto);
      expect(service.updateProject).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(mockProject);
    });
  });

  describe('deleteProject', () => {
    it('should call service.deleteProject and return success true', async () => {
      const result = await controller.deleteProject(1);
      expect(service.deleteProject).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
  });

  describe('toggleProjectFeatured', () => {
    it('should call service.toggleProjectFeatured', async () => {
      const result = await controller.toggleProjectFeatured(1);
      expect(service.toggleProjectFeatured).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProject);
    });
  });

  describe('uploadImage', () => {
    it('should call service.uploadImage with file and protocol baseUrl', async () => {
      const file = {} as Express.Multer.File;
      const req = {
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost'),
      } as any;

      const result = await controller.uploadImage(req, file);
      expect(service.uploadImage).toHaveBeenCalledWith(file, 'http://localhost');
      expect(result.success).toBe(true);
    });
  });
});
