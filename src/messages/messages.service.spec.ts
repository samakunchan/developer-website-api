import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessageFilter } from './dto/get-messages.dto';
import { Prisma } from '@prisma/client';

describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: PrismaService;

  const mockMessage = {
    id: 1,
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    serviceType: { id: 'web', icon: 'web-icon', label: 'Web' },
    priceRangeType: { id: 'medium', currency: 'USD', label: 'Medium' },
    projectBrief: 'A simple website building request.',
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: {
            message: {
              findMany: jest.fn().mockResolvedValue([mockMessage]),
              count: jest.fn().mockResolvedValue(1),
              update: jest.fn().mockResolvedValue(mockMessage),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMessages', () => {
    it('should return paginated messages with defaults', async () => {
      const result = await service.getMessages({});

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(prisma.message.count).toHaveBeenCalledWith({ where: {} });

      expect(result).toEqual({
        messages: [mockMessage],
        total: 1,
        totalPages: 1,
        currentPage: 1,
      });
    });

    it('should filter read messages only', async () => {
      await service.getMessages({ filter: MessageFilter.READ });
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isRead: true },
        }),
      );
    });

    it('should filter unread messages only', async () => {
      await service.getMessages({ filter: MessageFilter.UNREAD });
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isRead: false },
        }),
      );
    });

    it('should query OR conditions if search is specified', async () => {
      await service.getMessages({ search: 'test' });
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { fullName: { contains: 'test', mode: 'insensitive' } },
              { email: { contains: 'test', mode: 'insensitive' } },
              { projectBrief: { contains: 'test', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });
  });

  describe('toggleMessageRead', () => {
    it('should update the read status and return the message', async () => {
      const result = await service.toggleMessageRead(1, true);
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isRead: true },
      });
      expect(result).toEqual(mockMessage);
    });

    it('should throw NotFoundException if update fails with Prisma record not found error', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '7.7.0',
      });
      jest.spyOn(prisma.message, 'update').mockRejectedValueOnce(error);

      await expect(service.toggleMessageRead(999, true)).rejects.toThrow(NotFoundException);
    });

    it('should rethrow other database errors', async () => {
      const dbError = new Error('Database connection lost');
      jest.spyOn(prisma.message, 'update').mockRejectedValueOnce(dbError);

      await expect(service.toggleMessageRead(1, true)).rejects.toThrow(dbError);
    });
  });

  describe('getUnreadMessagesCount', () => {
    it('should call count with isRead: false', async () => {
      const result = await service.getUnreadMessagesCount();
      expect(prisma.message.count).toHaveBeenCalledWith({
        where: { isRead: false },
      });
      expect(result).toBe(1);
    });
  });
});
