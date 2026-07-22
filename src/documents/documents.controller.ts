import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiAuthGuard } from '../auth/api-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    return await this.documentsService.uploadDocument(file);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listDocuments() {
    return await this.documentsService.listDocuments();
  }

  @Delete(':name')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async deleteDocument(@Param('name') name: string) {
    return await this.documentsService.deleteDocument(name);
  }
}
