/**
 * FCT import CLI (blueprint §10 — CLI-only, never HTTP).
 *
 *   tsx src/cli/import-fct.ts acquire
 *     Download the FCT 2025 PDF from the recorded FAO URL, print sha256.
 *     The PDF is saved to fct-downloads/ (gitignored) — never committed.
 *
 *   tsx src/cli/import-fct.ts import --fixture
 *     Import prisma/fixtures/fct-2025-fixture-subset.jsonl (idempotent).
 *
 *   tsx src/cli/import-fct.ts import --file <path> [--url <url>] [--extract-sha256 <hex>]
 *     Import an arbitrary staged extract file.
 *
 *   tsx src/cli/import-fct.ts status
 *     List recent ImportRuns.
 *
 * Services are wired directly (no Nest context): tsx/esbuild does not emit
 * decorator metadata, so Nest DI would not resolve under tsx.
 */
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ImportsService, FCT_SOURCE } from '../imports/imports.service';
import { ImportsRepository } from '../imports/imports.repository';
import { FctParser } from '../imports/fct-parser';
import { FctRowValidator } from '../imports/fct-row-validator';
import { Canonicalizer } from '../imports/canonicalizer';
import { Transliterator } from '../imports/transliterator';
import { CategoryMapper } from '../imports/category-mapper';
import { PortionStandards } from '../imports/portion-standards';

loadEnv({ quiet: true });

const DEFAULT_PDF_URL =
  'https://openknowledge.fao.org/server/api/core/bitstreams/22c422c5-4c66-4233-aa15-0cd6e6c47f6e/content';
const FIXTURE_PATH = path.resolve(__dirname, '../../prisma/fixtures/fct-2025-fixture-subset.jsonl');

function sha256Of(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex').toUpperCase();
}

function usage(): never {
  console.error(
    'usage: import-fct.ts acquire | import (--fixture | --file <path> [--url <url>] [--extract-sha256 <hex>]) | status',
  );
  process.exit(2);
}

async function acquire(): Promise<void> {
  const downloadDir = path.resolve(__dirname, '../../fct-downloads');
  fs.mkdirSync(downloadDir, { recursive: true });
  const target = path.join(downloadDir, 'cd9308en.pdf');

  console.log(`downloading ${DEFAULT_PDF_URL}`);
  const response = await fetch(DEFAULT_PDF_URL);
  if (!response.ok) {
    throw new Error(`download failed: HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(target, buffer);
  console.log(`saved ${target} (${buffer.length} bytes)`);
  console.log(`sha256: ${sha256Of(buffer)}`);
  console.log('verify against prisma/fixtures/README.md, then run scripts/extract-fct.mjs');
}

interface Argv {
  command: string;
  file?: string;
  url?: string;
  extractSha256?: string;
  fixture?: boolean;
}

function parseArgs(argv: string[]): Argv {
  const command = argv[0];
  const result: Argv = { command };
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--fixture') result.fixture = true;
    else if (argv[i] === '--file') result.file = argv[++i];
    else if (argv[i] === '--url') result.url = argv[++i];
    else if (argv[i] === '--extract-sha256') result.extractSha256 = argv[++i];
  }
  return result;
}

function buildService(prisma: PrismaClient): ImportsService {
  return new ImportsService(
    new ImportsRepository(prisma),
    new FctParser(),
    new FctRowValidator(),
    new Canonicalizer(new Transliterator()),
    new CategoryMapper(),
    new PortionStandards(),
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.command) usage();

  if (args.command === 'acquire') {
    await acquire();
    return;
  }

  const prisma = new PrismaClient();
  try {
    if (args.command === 'status') {
      const runs = await prisma.importRun.findMany({ orderBy: { startedAt: 'desc' }, take: 10 });
      if (runs.length === 0) {
        console.log('no import runs yet');
        return;
      }
      for (const run of runs) {
        console.log(
          `${run.startedAt.toISOString()} ${run.status.padEnd(10)} ${run.sourceName}@${run.sourceVersion} ` +
            `${run.fileName} rows=${run.rowCount} sha=${run.fileSha256.slice(0, 12)}…`,
        );
      }
      return;
    }

    if (args.command === 'import') {
      const filePath = args.fixture ? FIXTURE_PATH : args.file;
      if (!filePath) usage();
      const bytes = fs.readFileSync(filePath);
      const fileSha256 = sha256Of(bytes);
      const service = buildService(prisma);
      const rows = service.parseJsonl(bytes.toString('utf8'));

      console.log(`importing ${path.basename(filePath)} (${rows.length} rows, sha256 ${fileSha256})`);
      const outcome = await service.importFile({
        fileName: path.basename(filePath),
        fileSha256,
        extractSha256: args.extractSha256,
        sourceUrl: args.url ?? (args.fixture ? DEFAULT_PDF_URL : undefined),
        rows,
        source: FCT_SOURCE,
      });

      if (outcome.status === 'skipped') {
        console.log(`SKIPPED (idempotent no-op) — importId ${outcome.importId}`);
      } else if (outcome.status === 'failed') {
        console.error(`FAILED — importId ${outcome.importId}`);
        for (const e of outcome.errors.slice(0, 20)) {
          console.error(`  ${e.code} ${e.field}: ${e.message}`);
        }
        process.exitCode = 1;
      } else {
        console.log(
          `COMMITTED — importId ${outcome.importId}, upserted ${outcome.upserted}, deprecated ${outcome.deprecated}`,
        );
      }
      return;
    }

    usage();
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
