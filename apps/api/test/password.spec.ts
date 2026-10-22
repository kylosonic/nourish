import { hashPassword, verifyPassword } from '../src/auth/password';

describe('email password hashing', () => {
  it('hashes with a unique salt and verifies the correct password', async () => {
    const first = await hashPassword('correct horse battery staple');
    const second = await hashPassword('correct horse battery staple');
    expect(first).not.toBe(second);
    expect(first).toMatch(/^scrypt-v1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    await expect(verifyPassword('correct horse battery staple', first)).resolves.toBe(true);
    await expect(verifyPassword('wrong password', first)).resolves.toBe(false);
  });

  it('refuses malformed hashes', async () => {
    await expect(verifyPassword('anything', 'plaintext')).resolves.toBe(false);
    await expect(verifyPassword('anything', null)).resolves.toBe(false);
  });
});
