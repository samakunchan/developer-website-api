import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetMessagesDto, MessageFilter } from './dto/get-messages.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch paginated and filtered messages from the database.
   */
  async getMessages(dto: GetMessagesDto) {
    const { page = 1, pageSize = 10, filter = MessageFilter.ALL, search } = dto;
    const skip = (page - 1) * pageSize;

    const where: Prisma.MessageWhereInput = {};

    if (filter === MessageFilter.READ) {
      where.isRead = true;
    } else if (filter === MessageFilter.UNREAD) {
      where.isRead = false;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { projectBrief: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      messages,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    };
  }

  /**
   * Toggle the read status of a message.
   */
  async toggleMessageRead(id: number, isRead: boolean) {
    try {
      return await this.prisma.message.update({
        where: { id },
        data: { isRead },
      });
    } catch (error) {
      // Prisma error code for record not found: P2025
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Message with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Get the total count of unread messages.
   */
  async getUnreadMessagesCount(): Promise<number> {
    return await this.prisma.message.count({
      where: { isRead: false },
    });
  }
}
