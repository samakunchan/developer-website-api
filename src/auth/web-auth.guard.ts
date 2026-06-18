import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { WebAuthService } from './web-auth.service';

@Injectable()
export class WebAuthGuard implements CanActivate {
  constructor(private readonly webAuthService: WebAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Try to read token from cookies
    let token = request.cookies?.['auth_session'];

    // 2. Fallback to Authorization Header
    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException('No authentication session token found');
    }

    const user = await this.webAuthService.verifySession(token);
    if (!user) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    request.user = user;
    return true;
  }
}
