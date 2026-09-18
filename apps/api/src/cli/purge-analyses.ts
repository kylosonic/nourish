/**
 * Retention housekeeping (SAFE-05, AUTH-02).
 *
 * Two things are purged, both of which stop having any value at a known time:
 *
 *  1. analysis *metadata* older than ANALYSIS_RETENTION_DAYS, with its items,
 *     candidates and corrections (cascade). Uploaded imagery is never stored in
 *     the first place, so there is no image archive to purge.
 *  2. expired one-time sign-in codes. Their hashes are useless once the validity
 *     window has passed, so keeping them would be storing a credential for no
 *     reason.
 *
 * Run it from cron or an operator shell; the API never deletes rows on a
 * request path.
 *
 *   tsx src/cli/purge-analyses.ts [--days N] [--dry-run] [--only-expired-otp]
 */
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../app.module';
import { EnvVars } from '../config/env';
import { AnalysisRepository } from '../analysis/analysis.repository';
import { AuthRepository } from '../auth/auth.repository';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const onlyExpiredOtp = argv.includes('--only-expired-otp');
  const daysArg = argv[argv.indexOf('--days') + 1];
  const daysOverride = argv.includes('--days') ? Number(daysArg) : undefined;

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const config = app.get(ConfigService<EnvVars, true>);
  const repo = app.get(AnalysisRepository);
  const authRepo = app.get(AuthRepository);

  const configured: number = config.get('ANALYSIS_RETENTION_DAYS', { infer: true });
  const days: number = daysOverride ?? configured;
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error(`invalid retention window: ${days}`);
  }
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const expiredCodes = await authRepo.countExpiredChallenges(new Date());
  if (dryRun) {
    console.log(
      `DRY RUN — expired sign-in codes: ${expiredCodes}; a purge would delete them.`,
    );
  } else {
    const deletedCodes = await authRepo.purgeExpiredChallenges(new Date());
    console.log(`purged ${deletedCodes} expired sign-in code(s)`);
  }

  if (onlyExpiredOtp) {
    await app.close();
    return;
  }

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
