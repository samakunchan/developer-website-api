import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiAuthGuard } from '../auth/api-auth.guard';
import { MessagesService } from './messages.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { UpdateMessageReadDto } from './dto/update-message-read.dto';

@Controller('messages')
@UseGuards(ApiAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getMessages(@Query() query: GetMessagesDto) {
    return await this.messagesService.getMessages(query);
  }

  @Get('unread-count')
  async getUnreadCount(): Promise<{ count: number }> {
    const count = await this.messagesService.getUnreadMessagesCount();
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async toggleMessageRead(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMessageReadDto,
  ) {
    const updated = await this.messagesService.toggleMessageRead(
      id,
      body.isRead,
    );
    return { success: true, message: updated };
  }
}
