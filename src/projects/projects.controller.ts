import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseEnumPipe,
  Post,
  Put,
  Patch,
  Req,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ApiAuthGuard } from '../auth/api-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
import { ProjectStatus } from '@prisma/client';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getProjects() {
    return await this.projectsService.getProjects();
  }

  @Get('status/:status')
  async getProjectsByStatus(@Param('status', new ParseEnumPipe(ProjectStatus)) status: ProjectStatus) {
    return await this.projectsService.getProjectsByStatus(status);
  }

  @Get(':id')
  async getProjectById(@Param('id', ParseIntPipe) id: number) {
    return await this.projectsService.getProjectById(id);
  }

  @Get('slug/:slug')
  async getProjectBySlug(@Param('slug') slug: string) {
    return await this.projectsService.getProjectBySlug(slug);
  }

  @Post()
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createProject(@Req() req: Request & { user: { id: number } }, @Body() body: CreateProjectDto) {
    return await this.projectsService.createProject(req.user.id, body);
  }

  @Put(':id')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async updateProject(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateProjectDto) {
    return await this.projectsService.updateProject(id, body);
  }

  @Delete(':id')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async deleteProject(@Param('id', ParseIntPipe) id: number) {
    await this.projectsService.deleteProject(id);
    return { success: true };
  }

  @Patch(':id/featured')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async toggleProjectFeatured(@Param('id', ParseIntPipe) id: number) {
    return await this.projectsService.toggleProjectFeatured(id);
  }

  @Post('upload')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Query('identifier') identifier?: string) {
    return await this.projectsService.uploadImage(file, identifier);
  }
}
