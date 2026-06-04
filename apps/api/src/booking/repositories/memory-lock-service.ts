import type { ILockService } from '../domain/lock-service.js';
import { sleep } from '../../utils/sleep.js';

export class MemoryLockService implements ILockService {
  private store = new Map<string, { userId: string; expiresAt: number }>();

  async acquire(key: string, ttlMS: number, userId: string): Promise<boolean> {
    const existing = this.store.get(key);
    if (existing && existing.expiresAt > Date.now()) {
      return false;
    }
    this.store.set(key, { userId, expiresAt: Date.now() + ttlMS });
    return true;
  }

  async release(key: string, userId: string): Promise<void> {
    const existing = this.store.get(key);
    if (!existing || existing.userId !== userId) {
      const { LockNotOwnedError } = await import('../domain/errors.js');
      throw new LockNotOwnedError(key, userId);
    }
    this.store.delete(key);
  }

  async verify(key: string, userId: string): Promise<boolean> {
    const existing = this.store.get(key);
    if (!existing) return false;
    if (existing.expiresAt <= Date.now()) {
      this.store.delete(key);
      return false;
    }
    return existing.userId === userId;
  }

  async listActive(prefix: string): Promise<{ key: string; userId: string; ttl: number }[]> {
    const now = Date.now();
    const results: { key: string; userId: string; ttl: number }[] = [];

    for (const [key, value] of this.store.entries()) {
      if (key.startsWith(prefix) && value.expiresAt > now) {
        results.push({
          key,
          userId: value.userId,
          ttl: value.expiresAt - now,
        });
      }
    }

    return results;
  }

  async simulateDelay(ms: number): Promise<void> {
    await sleep(ms);
  }
}
