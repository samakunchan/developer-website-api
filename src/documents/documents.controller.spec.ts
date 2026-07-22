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

import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ApiAuthService } from '../auth/api-auth.service';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: DocumentsService;

  const mockUploadResult = {
    success: true,
    url: 'http://localhost:3900/papanguesoft/123-file.pdf',
    name: '123-file.pdf',
  };

  const mockDocumentsList = [
    {
      name: '123-file.pdf',
      lastModified: new Date('2026-07-16T12:00:00Z'),
      size: 1024,
      url: 'http://localhost:3900/papanguesoft/123-file.pdf',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: {
            uploadDocument: jest.fn().mockResolvedValue(mockUploadResult),
            listDocuments: jest.fn().mockResolvedValue(mockDocumentsList),
            deleteDocument: jest.fn().mockResolvedValue({ success: true }),
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

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadDocument', () => {
    it('should call service.uploadDocument', async () => {
      const mockFile = {
        originalname: 'file.pdf',
        buffer: Buffer.from('hello'),
        size: 5,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const result = await controller.uploadDocument(mockFile);
      expect(service.uploadDocument).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockUploadResult);
    });
  });

  describe('listDocuments', () => {
    it('should call service.listDocuments', async () => {
      const result = await controller.listDocuments();
      expect(service.listDocuments).toHaveBeenCalled();
      expect(result).toEqual(mockDocumentsList);
    });
  });

  describe('deleteDocument', () => {
    it('should call service.deleteDocument', async () => {
      const result = await controller.deleteDocument('file.pdf');
      expect(service.deleteDocument).toHaveBeenCalledWith('file.pdf');
      expect(result).toEqual({ success: true });
    });
  });
});
