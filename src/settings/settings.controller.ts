import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateThemeDto } from './dto/update-theme.dto';
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
  async setTheme(
    @Body() body: UpdateThemeDto,
  ): Promise<{ success: boolean; theme: Theme }> {
    return await this.settingsService.setTheme(body.theme);
  }
}
