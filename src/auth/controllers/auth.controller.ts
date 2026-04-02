import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import type { User } from '@prisma/client';
import { LocalAuthGuard, JwtRefreshGuard } from '../guards';
import { SignUpDto } from '../dto';
import { CurrentUser, RefreshToken } from '../decorators';
import { ClientIp } from 'src/common/decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignUpDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('signin')
  @UseGuards(LocalAuthGuard)
  async signin(
    @CurrentUser() user: User,
    @Headers('user-agent') userAgent?: string,
    @ClientIp() ip?: string,
  ) {
    return this.authService.login(user, userAgent, ip);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @CurrentUser() user: User,
    @RefreshToken() refreshToken: string,
    @Headers('user-agent') userAgent?: string,
    @ClientIp() ip?: string,
  ) {
    return this.authService.refreshTokens(user, refreshToken, userAgent, ip);
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  async logout(
    @CurrentUser() user: User,
    @RefreshToken() refreshToken: string,
  ) {
    await this.authService.logout(user.id, refreshToken);

    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtRefreshGuard)
  async logoutAll(@CurrentUser() user: User) {
    await this.authService.logoutFromAllDevices(user.id);

    return { message: 'Logged out from all devices successfully' };
  }
}
