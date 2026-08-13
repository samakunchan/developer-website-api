import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as Minio from 'minio';

// Mock the minio module
jest.mock('minio', () => {
  const mockMinioClient = {
    bucketExists: jest.fn(),
    makeBucket: jest.fn(),
    putObject: jest.fn(),
    listObjectsV2: jest.fn(),
    statObject: jest.fn(),
    removeObject: jest.fn(),
  };
  return {
    Client: jest.fn().mockImplementation(() => mockMinioClient),
  };
});

describe('DocumentsService', () => {
  let service: DocumentsService;
  let mockClient: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentsService],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    // Get the mocked minio client instance
    mockClient = (Minio.Client as jest.Mock).mock.results[0].value;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should check if bucket exists and log connected message', async () => {
      mockClient.bucketExists.mockResolvedValue(true);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      await service.onModuleInit();

      expect(mockClient.bucketExists).toHaveBeenCalledWith('papanguesoft');
      expect(mockClient.makeBucket).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('🗄️ Garage S3: Connected to bucket "papanguesoft"');

      consoleLogSpy.mockRestore();
    });

    it('should create bucket if it does not exist', async () => {
      mockClient.bucketExists.mockResolvedValue(false);
      mockClient.makeBucket.mockResolvedValue(undefined);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

      await service.onModuleInit();

      expect(mockClient.bucketExists).toHaveBeenCalledWith('papanguesoft');
      expect(mockClient.makeBucket).toHaveBeenCalledWith('papanguesoft', 'garage');
      expect(consoleLogSpy).toHaveBeenCalledWith('🗄️ Garage S3: Created bucket "papanguesoft"');

      consoleLogSpy.mockRestore();
    });

    it('should catch errors and log them', async () => {
      const error = new Error('Connection refused');
      mockClient.bucketExists.mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await service.onModuleInit();

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Garage S3 Connection Error:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('uploadDocument', () => {
    const mockFile = {
      originalname: 'test file.pdf',
      buffer: Buffer.from('hello'),
      size: 5,
      mimetype: 'application/pdf',
    } as Express.Multer.File;

    it('should upload a document and return success/url/name', async () => {
      mockClient.putObject.mockResolvedValue(undefined);

      const result = await service.uploadDocument(mockFile);

      expect(mockClient.putObject).toHaveBeenCalledWith(
        'papanguesoft',
        expect.stringMatching(/^\d+-test_file.pdf$/),
        mockFile.buffer,
        mockFile.size,
        { 'Content-Type': 'application/pdf' },
      );
      expect(result.success).toBe(true);
      expect(result.url).toContain('papanguesoft.');
      expect(result.name).toMatch(/^\d+-test_file.pdf$/);
    });

    it('should throw InternalServerErrorException on upload error', async () => {
      mockClient.putObject.mockRejectedValue(new Error('S3 full'));

      await expect(service.uploadDocument(mockFile)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('listDocuments', () => {
    it('should list all documents and return them sorted by lastModified desc', async () => {
      const mockObjects = [
        { name: 'doc1.pdf', lastModified: '2026-07-16T12:00:00Z', size: 100 },
        { name: 'doc2.pdf', lastModified: '2026-07-16T13:00:00Z', size: 200 },
      ];

      const mockStream = {
        on: jest.fn().mockImplementation(function (event, callback) {
          if (event === 'data') {
            mockObjects.forEach((obj) => callback(obj));
          }
          if (event === 'end') {
            callback();
          }
          return this;
        }),
      };

      mockClient.listObjectsV2.mockReturnValue(mockStream);

      const result = await service.listDocuments();

      expect(mockClient.listObjectsV2).toHaveBeenCalledWith('papanguesoft', '', true);
      expect(result).toHaveLength(2);
      // Sorted desc by date
      expect(result[0].name).toBe('doc2.pdf');
      expect(result[1].name).toBe('doc1.pdf');
    });

    it('should throw InternalServerErrorException if stream emits error', async () => {
      const mockStream = {
        on: jest.fn().mockImplementation(function (event, callback) {
          if (event === 'error') {
            callback(new Error('S3 connection closed'));
          }
          return this;
        }),
      };

      mockClient.listObjectsV2.mockReturnValue(mockStream);

      await expect(service.listDocuments()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document if it exists', async () => {
      mockClient.statObject.mockResolvedValue({});
      mockClient.removeObject.mockResolvedValue(undefined);

      const result = await service.deleteDocument('doc.pdf');

      expect(mockClient.statObject).toHaveBeenCalledWith('papanguesoft', 'doc.pdf');
      expect(mockClient.removeObject).toHaveBeenCalledWith('papanguesoft', 'doc.pdf');
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if document is not found', async () => {
      const notFoundError = { code: 'NotFound' };
      mockClient.statObject.mockRejectedValue(notFoundError);

      await expect(service.deleteDocument('doc.pdf')).rejects.toThrow(NotFoundException);
      expect(mockClient.removeObject).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if stat check fails', async () => {
      mockClient.statObject.mockRejectedValue(new Error('Generic failure'));

      await expect(service.deleteDocument('doc.pdf')).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException if deletion fails', async () => {
      mockClient.statObject.mockResolvedValue({});
      mockClient.removeObject.mockRejectedValue(new Error('Cannot delete'));

      await expect(service.deleteDocument('doc.pdf')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('uploadFile', () => {
    const mockBuffer = Buffer.from('test buffer');

    it('should upload a file and return its public URL', async () => {
      mockClient.putObject.mockResolvedValue(undefined);

      const result = await service.uploadFile('test-key.txt', mockBuffer, 'text/plain');

      expect(mockClient.putObject).toHaveBeenCalledWith('papanguesoft', 'test-key.txt', mockBuffer, mockBuffer.length, {
        'Content-Type': 'text/plain',
      });
      expect(result).toContain('papanguesoft.web.garage.localhost:3902/test-key.txt');
    });

    it('should throw InternalServerErrorException if putObject fails', async () => {
      mockClient.putObject.mockRejectedValue(new Error('Upload failed'));

      await expect(service.uploadFile('test-key.txt', mockBuffer, 'text/plain')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteFile', () => {
    it('should remove object successfully', async () => {
      mockClient.removeObject.mockResolvedValue(undefined);

      await expect(service.deleteFile('test-key.txt')).resolves.not.toThrow();

      expect(mockClient.removeObject).toHaveBeenCalledWith('papanguesoft', 'test-key.txt');
    });

    it('should throw InternalServerErrorException if removeObject fails', async () => {
      mockClient.removeObject.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteFile('test-key.txt')).rejects.toThrow(InternalServerErrorException);
    });
  });
});
