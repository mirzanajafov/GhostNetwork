import {
  Controller,
  Post,
  Body,
  UseGuards,
  Headers,
  Res,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import type { User } from '@prisma/client';
import { LocalAuthGuard, JwtRefreshGuard } from '../guards';
import { SignUpDto } from '../dto';
import { CurrentUser, RefreshToken } from '../decorators';
import { ClientIp } from 'src/common/decorators';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Determines if cookies should be used based on environment
   * Production uses httpOnly cookies for security
   * Development uses JSON responses for easier testing
   */
  private shouldUseCookies(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private getCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    };
  }

  @Post('signup')
  async signup(@Body() dto: SignUpDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('signin')
  @UseGuards(LocalAuthGuard)
  async signin(
    @CurrentUser() user: User,
    @Headers('user-agent') userAgent: string | undefined,
    @ClientIp() ip: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(user, userAgent, ip);

    if (this.shouldUseCookies()) {
      res.cookie(
        'refresh_token',
        tokens.refresh_token,
        this.getCookieOptions(),
      );
      return { access_token: tokens.access_token };
    }

    return tokens;
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @CurrentUser() user: User,
    @RefreshToken() refreshToken: string,
    @Headers('user-agent') userAgent: string | undefined,
    @ClientIp() ip: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshTokens(
      user,
      refreshToken,
      userAgent,
      ip,
    );

    if (this.shouldUseCookies()) {
      // Production: Set new refresh token as httpOnly cookie
      res.cookie(
        'refresh_token',
        tokens.refresh_token,
        this.getCookieOptions(),
      );
      return { access_token: tokens.access_token };
    }

    // Development: Return both tokens in JSON
    return tokens;
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  async logout(
    @CurrentUser() user: User,
    @RefreshToken() refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id, refreshToken);

    if (this.shouldUseCookies()) {
      res.clearCookie('refresh_token', { path: '/' });
    }

    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtRefreshGuard)
  async logoutAll(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutFromAllDevices(user.id);

    if (this.shouldUseCookies()) {
      res.clearCookie('refresh_token', { path: '/' });
    }

    return { message: 'Logged out from all devices successfully' };
  }
}
