import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { WebAuthService } from './web-auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { WebAuthGuard } from './web-auth.guard';

@Controller('auth/web')
export class WebAuthController {
  constructor(private readonly webAuthService: WebAuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.webAuthService.signIn(body);

    res.cookie('auth_session', result.token, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === 'production' &&
        process.env.SECURE_COOKIES !== 'false',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    });

    return { success: true, user: result.user };
  }

  @Post('sign-out')
  @UseGuards(WebAuthGuard)
  @HttpCode(HttpStatus.OK)
  async signOut(
    @Req() req: Request & { user: { id: number } },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.webAuthService.signOut(req.user.id);

    res.clearCookie('auth_session', {
      path: '/',
    });

    return { success: true };
  }

  @Get('session')
  @UseGuards(WebAuthGuard)
  async session(@Req() req: Request & { user: any }) {
    return { user: req.user };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return await this.webAuthService.forgotPassword(body);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return await this.webAuthService.resetPassword(body);
  }
}
