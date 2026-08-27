import { describe, it, expect, beforeEach } from 'vitest';
import { PasswordService } from '../password.service';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  it('should hash a password with Argon2id', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await passwordService.hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');
  });

  it('should verify correct password', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await passwordService.hashPassword(rawPassword);

    const isValid = await passwordService.verifyPassword(hash, rawPassword);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await passwordService.hashPassword(rawPassword);

    const isValid = await passwordService.verifyPassword(hash, 'WrongPassword123!');
    expect(isValid).toBe(false);
  });
});
