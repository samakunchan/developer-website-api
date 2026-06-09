import { Module } from '@nestjs/common';
import { WebAuthController } from './web-auth.controller';
import { ApiAuthController } from './api-auth.controller';
import { WebAuthService } from './web-auth.service';
import { ApiAuthService } from './api-auth.service';
import { WebAuthGuard } from './web-auth.guard';
import { ApiAuthGuard } from './api-auth.guard';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [WebAuthController, ApiAuthController],
  providers: [WebAuthService, ApiAuthService, WebAuthGuard, ApiAuthGuard],
  exports: [WebAuthService, ApiAuthService, WebAuthGuard, ApiAuthGuard],
})
export class AuthModule {}
