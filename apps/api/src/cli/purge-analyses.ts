/**
 * Analysis metadata retention (SAFE-05 / S2 blueprint §5).
 *
 * Uploaded imagery is never stored, so this purges analysis *metadata* only:
 * runs older than ANALYSIS_RETENTION_DAYS, together with their items,
 * candidates and corrections (cascade). Run it from cron or an operator shell;
 * the API never deletes rows on a request path.
 *
 *   tsx src/cli/purge-analyses.ts [--days N] [--dry-run]
 */
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module';
import { EnvVars } from '../config/env';
import { AnalysisRepository } from '../analysis/analysis.repository';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const daysArg = argv[argv.indexOf('--days') + 1];
  const daysOverride = argv.includes('--days') ? Number(daysArg) : undefined;

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const config = app.get(ConfigService<EnvVars, true>);
  const repo = app.get(AnalysisRepository);

  const configured: number = config.get('ANALYSIS_RETENTION_DAYS', { infer: true });
  const days: number = daysOverride ?? configured;
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error(`invalid retention window: ${days}`);
  }
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const pending = await repo.countCreatedSince(new Date(0));
  if (dryRun) {
    console.log(
      `DRY RUN — ${pending} analysis run(s) exist; a purge would delete those created before ` +
        `${cutoff.toISOString()} (retention ${days} day(s))`,
    );
  } else {
    const deleted = await repo.purgeOlderThan(cutoff);
    console.log(
      `purged ${deleted} analysis run(s) older than ${cutoff.toISOString()} ` +
        `(retention ${days} day(s)); ${pending - deleted} kept`,
    );
  }
  await app.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
