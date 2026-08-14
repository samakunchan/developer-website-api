import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { AccountService } from './account.service';
import { RegisterDto } from './dto/register.dto';
import { ApiAuthGuard } from '../auth/api-auth.guard';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto) {
    return await this.accountService.register(body);
  }

  @Get('me')
  @UseGuards(ApiAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req: Request & { user: { id: number } }) {
    return await this.accountService.getMe(req.user.id);
  }
}
