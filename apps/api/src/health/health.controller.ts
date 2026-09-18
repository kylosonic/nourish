import { Controller, Get, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/error/error-codes';
import { NourishHttpException } from '../common/error/error-envelope';

const SERVICE_NAME = 'nourish-api';
const API_VERSION = '0.1.0-s1';

/**
 * GET /v1/healthz — liveness + database ping. Rate-limit exempt (§8).
 * No Redis dependency: Redis is provisioned for S3 parity only (D2).
 */
@SkipThrottle()
@Controller('healthz')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async healthz(): Promise<{ status: string; service: string; version: string; db: string }> {
    let dbUp = true;
    try {
      // Parameterized ping (no raw SQL): a benign indexed count proves connectivity.
      await this.prisma.foodCategory.count();
    } catch {
      dbUp = false;
    }
    if (!dbUp) {
      throw new NourishHttpException(
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorCode.INTERNAL,
        'database unavailable',
      );
    }
    return { status: 'ok', service: SERVICE_NAME, version: API_VERSION, db: 'up' };
  }
}
