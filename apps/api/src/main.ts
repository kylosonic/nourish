import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { EnvVars } from './config/env';
import { configureApp } from './app.setup';
import { NourishLogger } from './common/logger/nourish-logger';

async function bootstrap(): Promise<void> {
  const logger = new NourishLogger('bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });

  const config = app.get(ConfigService<EnvVars, true>);

  // Sentry: DSN-gated, fully disabled when SENTRY_DSN is unset (D4).
  const sentryDsn = config.get('SENTRY_DSN', { infer: true });
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV ?? 'development',
      release: 'nourish-api@0.1.0-s1',
    });
    logger.log('sentry enabled');
  } else {
    logger.log('sentry disabled (SENTRY_DSN unset)');
  }

  configureApp(app, config);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  logger.log(`nourish-api listening on :${port}`);
}

void bootstrap();
