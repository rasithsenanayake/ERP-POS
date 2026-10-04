import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CredentialsDto, RegisterDto } from './auth.dto';
import { SessionGuard } from './session.guard';

type SessionRequest = Request & { userId: string };
const SESSION_COOKIE = 'erp_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Post('register')
  async register(@Body() input: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.register(input);
    this.setSessionCookie(response, session.token);
    return session.account;
  }

  @Post('login')
  async login(@Body() input: CredentialsDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.signIn(input);
    this.setSessionCookie(response, session.token);
    return session.account;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(SESSION_COOKIE, { path: '/', sameSite: 'lax', secure: this.cookieIsSecure(), httpOnly: true });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  async me(@Req() request: SessionRequest) {
    return this.auth.accountForUser(request.userId);
  }

  private setSessionCookie(response: Response, token: string) {
    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: this.cookieIsSecure(),
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE
    });
  }

  private cookieIsSecure() {
    const configured = this.config.get<string>('COOKIE_SECURE');
    return configured === 'true' || (configured !== 'false' && this.config.get<string>('NODE_ENV') === 'production');
  }
}
