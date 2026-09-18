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

/** Truncate all tables between suites (FK order). */
export async function truncateAll(prisma: PrismaClient): Promise<void> {
  await prisma.food.deleteMany();
  await prisma.importRun.deleteMany();
  await prisma.foodCategory.deleteMany();
}

/** Import the verified fixture subset through the real pipeline (as the CLI does). */
export function fixtureBytes(): Buffer {
  return fs.readFileSync(path.resolve(__dirname, '../prisma/fixtures/fct-2025-fixture-subset.jsonl'));
}
