/**
 * Shared test helpers: test DB env + deterministic truncation between suites.
 */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://nourish:nourish@localhost:5432/nourish_test?schema=public';

/**
 * Point the app at the dedicated test database. Must be called BEFORE any
 * Nest app is created or PrismaClient is instantiated. If the runner already
 * exported DATABASE_URL (CI), it is honored as-is.
 */
export function setTestEnv(): void {
  if (!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL) return; // CI-provided URL wins
  process.env.DATABASE_URL = TEST_DATABASE_URL;
}

/**
 * Point the analysis module at the deterministic fixture provider (ADR-0007).
 * Suites that exercise the pipeline call this before creating the Nest app; the
 * factory refuses the fixture provider in production, so this cannot leak into a
 * real deployment.
 */
export function setFixtureAiProvider(): void {
  process.env.AI_PROVIDER = 'fixture';
}

/** Force the "no provider configured" path (503 AI_UNAVAILABLE). */
export function setNoAiProvider(): void {
  process.env.AI_PROVIDER = 'none';
}

/** Truncate all tables between suites (FK order). */
export async function truncateAll(prisma: PrismaClient): Promise<void> {
  // S3 account mirror (children first).
  await prisma.mealItem.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.waterLog.deleteMany();
  await prisma.weightLog.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.entitlement.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.otpChallenge.deleteMany();
  await prisma.user.deleteMany();

  // S2 analysis layer.
  await prisma.analysisCorrection.deleteMany();
  await prisma.analysisCandidate.deleteMany();
  await prisma.analysisItem.deleteMany();
  await prisma.analysisRun.deleteMany();

  // S1 food layer.
  await prisma.food.deleteMany();
  await prisma.importRun.deleteMany();
  await prisma.foodCategory.deleteMany();
}

/** Import the verified fixture subset through the real pipeline (as the CLI does). */
export function fixtureBytes(): Buffer {
  return fs.readFileSync(path.resolve(__dirname, '../prisma/fixtures/fct-2025-fixture-subset.jsonl'));
}
