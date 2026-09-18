/**
 * Dev seed (npm run db:seed / prisma migrate reset): imports the verified
 * FCT fixture subset through the SAME pipeline as the CLI — idempotent,
 * deterministic, provenance-complete.
 */
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { FctParser } from '../src/imports/fct-parser';
import { FctRowValidator } from '../src/imports/fct-row-validator';
import { Canonicalizer } from '../src/imports/canonicalizer';
import { Transliterator } from '../src/imports/transliterator';
import { CategoryMapper } from '../src/imports/category-mapper';
import { PortionStandards } from '../src/imports/portion-standards';
import { ImportsRepository } from '../src/imports/imports.repository';
import { ImportsService, FCT_SOURCE } from '../src/imports/imports.service';

loadEnv({ quiet: true });

const FIXTURE_PATH = path.resolve(__dirname, 'fixtures/fct-2025-fixture-subset.jsonl');
const FIXTURE_URL =
  'https://openknowledge.fao.org/server/api/core/bitstreams/22c422c5-4c66-4233-aa15-0cd6e6c47f6e/content';

async function seed(): Promise<void> {
  const prisma = new PrismaClient();
  const service = new ImportsService(
    new ImportsRepository(prisma),
    new FctParser(),
    new FctRowValidator(),
    new Canonicalizer(new Transliterator()),
    new CategoryMapper(),
    new PortionStandards(),
  );

  try {
    const bytes = fs.readFileSync(FIXTURE_PATH);
    const fileSha256 = createHash('sha256').update(bytes).digest('hex').toUpperCase();
    const rows = service.parseJsonl(bytes.toString('utf8'));

    console.log(`seed: importing fixture subset (${rows.length} rows, sha256 ${fileSha256})`);
    const outcome = await service.importFile({
      fileName: path.basename(FIXTURE_PATH),
      fileSha256,
      sourceUrl: FIXTURE_URL,
      rows,
      source: FCT_SOURCE,
    });

    if (outcome.status === 'skipped') {
      console.log(`seed: already imported (${outcome.importId}) — no-op`);
    } else if (outcome.status === 'failed') {
      console.error(`seed: FAILED — ${outcome.errors.map((e) => `${e.code} ${e.message}`).join('; ')}`);
      process.exitCode = 1;
    } else {
      console.log(`seed: committed ${outcome.upserted} foods (importId ${outcome.importId})`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

void seed();
