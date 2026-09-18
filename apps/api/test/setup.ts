/**
 * jest globalSetup for e2e: provisions the dedicated `nourish_test` database
 * and applies `prisma migrate deploy` before every run (blueprint §15).
 * Local runs use the compose Postgres; CI uses GitHub Actions service
 * containers (DATABASE_URL env).
 */
import { execSync } from 'node:child_process';
import { Client } from 'pg';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://nourish:nourish@localhost:5432/nourish_test?schema=public';

function maintenanceUrl(dbUrl: string): { url: string; dbName: string } {
  const parsed = new URL(dbUrl);
  const dbName = parsed.pathname.replace(/^\//, '').split('?')[0];
  parsed.pathname = '/postgres';
  return { url: parsed.toString(), dbName };
}

module.exports = async function globalSetup(): Promise<void> {
  const { url, dbName } = maintenanceUrl(TEST_DATABASE_URL);

  // 1. Create the test database if absent.
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[test-setup] created database ${dbName}`);
    } else {
      console.log(`[test-setup] database ${dbName} exists`);
    }
  } catch (err) {
    // Race with a parallel run — a duplicate CREATE is not fatal.
    const msg = err instanceof Error ? err.message : String(err);
    if (!/already exists/.test(msg)) throw err;
  } finally {
    await client.end();
  }

  // 2. Apply migrations.
  console.log('[test-setup] prisma migrate deploy →', dbName);
  execSync('npx prisma migrate deploy', {
    cwd: __dirname + '/..',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
};
