import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import type { Request } from 'express';
import { User } from '@prisma/client';
import { LocalAuthGuard, JwtRefreshGuard } from '../guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.register(email, password);
  }

  @Post('signin')
  @UseGuards(LocalAuthGuard)
  async signin(@Req() req: Request) {
    const user = req.user as User;
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;

    return this.authService.login(user, userAgent, ip);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() req: Request) {
    const user = req.user as User;
    const refreshToken = req.headers.authorization?.replace('Bearer ', '');
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;

    if (!refreshToken) {
      throw new Error('Refresh token not provided');
    }

    return this.authService.refreshTokens(user, refreshToken, userAgent, ip);
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  async logout(@Req() req: Request) {
    const user = req.user as User;
    const refreshToken = req.headers.authorization?.replace('Bearer ', '');

    if (!refreshToken) {
      throw new Error('Refresh token not provided');
    }

    await this.authService.logout(user.id, refreshToken);

    return { message: 'Logged out successfully' };
  }
}
