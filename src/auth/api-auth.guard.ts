import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiAuthService } from './api-auth.service';

@Injectable()
export class ApiAuthGuard implements CanActivate {
  constructor(private readonly apiAuthService: ApiAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No Bearer authentication token found in Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const user = await this.apiAuthService.verifyToken(token);
    if (!user) {
      throw new UnauthorizedException('Token is invalid or expired');
    }

    request.user = user;
    return true;
  }
}
