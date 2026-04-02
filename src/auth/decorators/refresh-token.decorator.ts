import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Extract refresh token from Authorization header or cookie
 * Hybrid approach:
 * 1. Try Authorization header first (development)
 * 2. Fallback to cookie (production)
 * 3. Throw UnauthorizedException if neither exists
 */
export const RefreshToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // Try Authorization header first
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.replace('Bearer ', '');
    }

    // Fallback to cookie
    const cookieToken = request.cookies?.refresh_token as string | undefined;
    if (cookieToken) {
      return cookieToken;
    }

    throw new UnauthorizedException('Refresh token not provided');
  },
);
