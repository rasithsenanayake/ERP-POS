import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

type SessionRequest = Request & { userId?: string; cookies?: Record<string, string> };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const token = request.cookies?.erp_session;
    if (!token) throw new UnauthorizedException('Sign in to continue.');

    try {
      const payload = await this.jwt.verifyAsync<{ sub?: string }>(token);
      if (!payload.sub) throw new Error('Missing session subject');
      request.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Your session expired. Sign in again.');
    }
  }
}
