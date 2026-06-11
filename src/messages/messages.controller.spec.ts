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

import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ApiAuthService } from '../auth/api-auth.service';
import { MessageFilter } from './dto/get-messages.dto';

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: MessagesService;

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
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: {
            getMessages: jest.fn().mockResolvedValue({
              messages: [mockMessage],
              total: 1,
              totalPages: 1,
              currentPage: 1,
            }),
            toggleMessageRead: jest.fn().mockResolvedValue(mockMessage),
            getUnreadMessagesCount: jest.fn().mockResolvedValue(5),
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

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMessages', () => {
    it('should call service getMessages and return the result', async () => {
      const query = { page: 1, pageSize: 10, filter: MessageFilter.ALL };
      const result = await controller.getMessages(query);

      expect(service.getMessages).toHaveBeenCalledWith(query);
      expect(result).toEqual({
        messages: [mockMessage],
        total: 1,
        totalPages: 1,
        currentPage: 1,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count object', async () => {
      const result = await controller.getUnreadCount();

      expect(service.getUnreadMessagesCount).toHaveBeenCalled();
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('toggleMessageRead', () => {
    it('should call service toggleMessageRead and return success response', async () => {
      const body = { isRead: true };
      const result = await controller.toggleMessageRead(1, body);

      expect(service.toggleMessageRead).toHaveBeenCalledWith(1, true);
      expect(result).toEqual({
        success: true,
        message: mockMessage,
      });
    });
  });
});
