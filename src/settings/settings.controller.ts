import { Controller, Get, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { UpdateLegalDocumentDto } from './dto/update-legal-document.dto';
import { ApiAuthGuard } from '../auth/api-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Theme } from '@prisma/client';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('theme')
  async getTheme(): Promise<{ theme: Theme }> {
    const theme = await this.settingsService.getTheme();
    return { theme };
  }

  @Put('theme')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async setTheme(@Body() body: UpdateThemeDto): Promise<{ success: boolean; theme: Theme }> {
    return await this.settingsService.setTheme(body.theme);
  }

  @Get('legal-mentions')
  async getLegalMentions() {
    return await this.settingsService.getLegalMentions();
  }

  @Put('legal-mentions')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async setLegalMentions(@Body() body: UpdateLegalDocumentDto) {
    return await this.settingsService.setLegalMentions(body.title, body.content);
  }

  @Get('cgu')
  async getCGU() {
    return await this.settingsService.getCGU();
  }

  @Put('cgu')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async setCGU(@Body() body: UpdateLegalDocumentDto) {
    return await this.settingsService.setCGU(body.title, body.content);
  }

  @Get('privacy-policy')
  async getPrivacyPolicy() {
    return await this.settingsService.getPrivacyPolicy();
  }

  @Put('privacy-policy')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async setPrivacyPolicy(@Body() body: UpdateLegalDocumentDto) {
    return await this.settingsService.setPrivacyPolicy(body.title, body.content);
  }

  @Get('cookie-policy')
  async getCookiePolicy() {
    return await this.settingsService.getCookiePolicy();
  }

  @Put('cookie-policy')
  @UseGuards(ApiAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async setCookiePolicy(@Body() body: UpdateLegalDocumentDto) {
    return await this.settingsService.setCookiePolicy(body.title, body.content);
  }
}
