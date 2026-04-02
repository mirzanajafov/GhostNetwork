import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Extract and normalize client IP address
 *
 * Features:
 * - Normalizes IPv6 localhost (::1) to IPv4 (127.0.0.1)
 * - Converts IPv6-mapped IPv4 addresses to IPv4
 * - Supports proxy headers (X-Forwarded-For, X-Real-IP)
 * - Returns undefined if IP cannot be determined
 *
 * @example
 * ```typescript
 * async login(@ClientIp() ip?: string) {
 *   // Development: "127.0.0.1" (not "::1")
 *   // Production: Real client IP from proxy headers
 * }
 * ```
 */
export const ClientIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // Try to get IP from proxy headers first (production)
    const forwardedFor = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'];

    let ip: string | undefined;

    if (forwardedFor) {
      // X-Forwarded-For can be comma-separated list, take first one
      ip = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      ip = Array.isArray(realIp) ? realIp[0] : realIp;
    } else {
      // Fallback to request.ip or socket.remoteAddress
      ip = request.ip || request.socket?.remoteAddress;
    }

    if (!ip) return undefined;

    // Normalize IPv6 localhost to IPv4
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }

    // Convert IPv6-mapped IPv4 to IPv4
    if (ip.startsWith('::ffff:')) {
      return ip.replace('::ffff:', '');
    }

    return ip;
  },
);
