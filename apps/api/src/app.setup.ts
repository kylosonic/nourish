import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { json } from 'express';
import { EnvVars, isOriginAllowed, parseCorsOrigins } from './config/env';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { NourishLogger } from './common/logger/nourish-logger';

/**
 * Bootstrap configuration shared by main.ts and the e2e suites so tests run
 * against the exact production middleware stack (helmet, CORS allowlist,
 * global ValidationPipe, error envelope filter, request ids, /v1 prefix).
 */
export function configureApp(app: NestExpressApplication, config: ConfigService<EnvVars, true>): void {
  const logger = new NourishLogger('bootstrap');

  app.use(helmet());

  const corsOrigins = parseCorsOrigins(config.get('CORS_ORIGINS', { infer: true }));
  app.enableCors({
    origin: (origin, callback) => {
      // Non-allowlisted origins proceed WITHOUT CORS headers (browsers block
      // the response read) — never a wildcard echo, never a 500.
      callback(null, !origin || isOriginAllowed(origin, corsOrigins));
    },
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'If-None-Match', 'X-Request-Id'],
    exposedHeaders: ['ETag', 'X-Request-Id'],
    maxAge: 86400,
  });

  app.use(json({ limit: '100kb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());
  app.setGlobalPrefix('v1');

  logger.log('app configured (helmet, cors, validation, envelope, /v1 prefix)');
}
