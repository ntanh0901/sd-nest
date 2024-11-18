import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new ForbiddenException('Access denied');
    }
    try {
      const payload = this.jwtService.verify(token);
      if (payload.role !== 'admin') {
        throw new ForbiddenException('Access denied');
      }
      request.user = payload;
    } catch (error) {
      throw new ForbiddenException('Access denied');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      return undefined;
    }
    const [bearer, token] = authHeader.split(' ');
    return bearer === 'Bearer' ? token : undefined;
  }
}
