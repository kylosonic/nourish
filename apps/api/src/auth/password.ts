import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
} as const;
const PREFIX = 'scrypt-v1';

function derive(password: string, salt: Uint8Array): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt);
  return `${PREFIX}$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  encoded: string | null | undefined,
): Promise<boolean> {
  if (!encoded) return false;
  const [prefix, saltHex, keyHex] = encoded.split('$');
  if (prefix !== PREFIX || !saltHex || !keyHex) return false;
  try {
    const expected = Buffer.from(keyHex, 'hex');
    const actual = await derive(password, Buffer.from(saltHex, 'hex'));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
