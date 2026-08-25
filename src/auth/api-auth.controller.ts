import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { ApiAuthService } from './api-auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiAuthGuard } from './api-auth.guard';

@Controller('auth')
export class ApiAuthController {
  constructor(private readonly apiAuthService: ApiAuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() body: SignInDto) {
    const result = await this.apiAuthService.signIn(body);
    return {
      success: true,
      token: result.token,
      user: result.user,
    };
  }

  @Post('sign-out')
  @UseGuards(ApiAuthGuard)
  @HttpCode(HttpStatus.OK)
  async signOut(@Req() req: Request & { user: { id: number } }) {
    await this.apiAuthService.signOut(req.user.id);
    return { success: true };
  }

  @Get('session')
  @UseGuards(ApiAuthGuard)
  async session(@Req() req: Request & { user: any }) {
    return { user: req.user };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return await this.apiAuthService.forgotPassword(body);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return await this.apiAuthService.resetPassword(body);
  }
}
