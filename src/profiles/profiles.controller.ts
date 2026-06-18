import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ApiAuthGuard } from '../auth/api-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CreateTechStackDto } from './dto/create-tech-stack.dto';
import { CreateSocialLinkDto } from './dto/create-social-link.dto';
import { UpdatePersonalInfoDto } from './dto/update-personal-info.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('presentation')
  async getProfilePresentation() {
    return await this.profilesService.getProfilePresentation();
  }

  @Get()
  @UseGuards(ApiAuthGuard, AdminGuard)
  async getProfile(@Req() req: Request & { user: { id: number } }) {
    return await this.profilesService.getProfile(req.user.id);
  }

  @Put('personal-info')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async updatePersonalInfo(@Req() req: Request & { user: { id: number } }, @Body() body: UpdatePersonalInfoDto) {
    return await this.profilesService.updatePersonalInfo(req.user.id, body);
  }

  @Post('tech-stack')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async addTechStack(@Req() req: Request & { user: { id: number } }, @Body() body: CreateTechStackDto) {
    return await this.profilesService.addTechStack(req.user.id, body);
  }

  @Delete('tech-stack/:id')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async removeTechStack(@Req() req: Request & { user: { id: number } }, @Param('id', ParseIntPipe) id: number) {
    await this.profilesService.removeTechStack(req.user.id, id);
    return { success: true };
  }

  @Post('social-link')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async addSocialLink(@Req() req: Request & { user: { id: number } }, @Body() body: CreateSocialLinkDto) {
    return await this.profilesService.addSocialLink(req.user.id, body);
  }

  @Delete('social-link/:id')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async removeSocialLink(@Req() req: Request & { user: { id: number } }, @Param('id', ParseIntPipe) id: number) {
    await this.profilesService.removeSocialLink(req.user.id, id);
    return { success: true };
  }

  @Post('avatar')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async updateAvatar(@Req() req: Request & { user: { id: number } }, @UploadedFile() file: Express.Multer.File) {
    const protocol = req.protocol;
    const host = req.get('host');
    const apiBaseUrl = `${protocol}://${host}`;
    return await this.profilesService.updateAvatar(req.user.id, file, apiBaseUrl);
  }
}
