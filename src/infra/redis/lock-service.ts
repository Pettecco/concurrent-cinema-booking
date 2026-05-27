import type { Redis } from 'ioredis';
import type { ILockService } from '../../booking/domain/lock-service.js';
import { LockNotOwnedError } from '../../booking/domain/errors.js';

export class RedisLockService implements ILockService {
  constructor(private readonly redis: Redis) {}

  async acquire(key: string, ttlMS: number, userId: string): Promise<boolean> {
    const result = await this.redis.set(key, userId, 'PX', ttlMS, 'NX');
    return result === 'OK';
  }

  async release(key: string, userId: string): Promise<void> {
    const canRelease = await this.verify(key, userId);

    if (!canRelease) {
      throw new LockNotOwnedError(key, userId);
    }
    await this.redis.del(key);
  }

  async verify(key: string, userId: string): Promise<boolean> {
    const owner = await this.redis.get(key);
    return owner === userId;
  }
}
