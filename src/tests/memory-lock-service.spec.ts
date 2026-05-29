import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryLockService } from '../booking/repositories/memory-lock-service.js';

describe('MemoryLockService', () => {
  let service: MemoryLockService;

  beforeEach(() => {
    service = new MemoryLockService();
  });

  describe('acquire', () => {
    it('returns true when lock is available', async () => {
      const result = await service.acquire('lock:1:A1', 300_000, 'user-1');
      expect(result).toBe(true);
    });

    it('returns false when lock is held by another user', async () => {
      await service.acquire('lock:1:A1', 300_000, 'user-1');
      const result = await service.acquire('lock:1:A1', 300_000, 'user-2');
      expect(result).toBe(false);
    });

    it('allows acquiring after TTL expires', async () => {
      await service.acquire('lock:1:A1', 50, 'user-1');
      await service.simulateDelay(60);
      const result = await service.acquire('lock:1:A1', 300_000, 'user-2');
      expect(result).toBe(true);
    });
  });

  describe('verify', () => {
    it('returns true for valid owner', async () => {
      await service.acquire('lock:1:A1', 300_000, 'user-1');
      const result = await service.verify('lock:1:A1', 'user-1');
      expect(result).toBe(true);
    });

    it('returns false for non-owner', async () => {
      await service.acquire('lock:1:A1', 300_000, 'user-1');
      const result = await service.verify('lock:1:A1', 'user-2');
      expect(result).toBe(false);
    });

    it('returns false for non-existent lock', async () => {
      const result = await service.verify('lock:1:A1', 'user-1');
      expect(result).toBe(false);
    });

    it('returns false after TTL expires', async () => {
      await service.acquire('lock:1:A1', 50, 'user-1');
      await service.simulateDelay(60);
      const result = await service.verify('lock:1:A1', 'user-1');
      expect(result).toBe(false);
    });
  });

  describe('release', () => {
    it('releases lock for valid owner', async () => {
      await service.acquire('lock:1:A1', 300_000, 'user-1');
      await service.release('lock:1:A1', 'user-1');
      const result = await service.verify('lock:1:A1', 'user-1');
      expect(result).toBe(false);
    });

    it('throws LockNotOwnedError for non-owner', async () => {
      await service.acquire('lock:1:A1', 300_000, 'user-1');
      await expect(service.release('lock:1:A1', 'user-2')).rejects.toThrow(
        /not owned by user/
      );
    });

    it('throws LockNotOwnedError for non-existent lock', async () => {
      await expect(service.release('lock:1:A1', 'user-1')).rejects.toThrow(
        /not owned by user/
      );
    });
  });
});
