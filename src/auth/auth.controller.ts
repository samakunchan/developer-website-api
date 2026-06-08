import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signIn(body);
    
    res.cookie('auth_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.SECURE_COOKIES !== 'false',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    });

    return { success: true, user: result.user };
  }

  @Post('sign-out')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async signOut(
    @Req() req: Request & { user: { id: number } },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.signOut(req.user.id);
    
    res.clearCookie('auth_session', {
      path: '/',
    });

    return { success: true };
  }

  @Get('session')
  @UseGuards(AuthGuard)
  async session(@Req() req: Request & { user: any }) {
    return { user: req.user };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return await this.authService.forgotPassword(body);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return await this.authService.resetPassword(body);
  }
}
