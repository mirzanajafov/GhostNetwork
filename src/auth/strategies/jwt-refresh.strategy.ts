import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ConfigurationService } from 'src/config/configuration.service';
import { User } from '@prisma/client';
import type { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly userService: UserService;

  constructor(config: ConfigurationService, userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from Authorization header first (development)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Fallback to cookie (production)
        (request: Request) => {
          return request?.cookies?.refresh_token as string | null;
        },
      ]),
      secretOrKey: config.jwtRefreshSecret,
      passReqToCallback: false,
    });
    this.userService = userService;
  }

  async validate(payload: {
    sub: string;
    email: string;
  }): Promise<User | null> {
    const authUser = await this.userService.findOne(payload.sub);
    if (!authUser) {
      throw new UnauthorizedException('Invalid token');
    }
    return authUser;
  }
}
