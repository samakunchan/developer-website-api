import { Module } from '@nestjs/common';
import { ApiAuthController } from './api-auth.controller';
import { ApiAuthService } from './api-auth.service';
import { ApiAuthGuard } from './api-auth.guard';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [ApiAuthController],
  providers: [ApiAuthService, ApiAuthGuard],
  exports: [ApiAuthService, ApiAuthGuard],
})
export class AuthModule {}
