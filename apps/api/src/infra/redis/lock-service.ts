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
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, key, userId);

    if (result === 0) {
      throw new LockNotOwnedError(key, userId);
    }
  }

  async verify(key: string, userId: string): Promise<boolean> {
    const owner = await this.redis.get(key);
    return owner === userId;
  }

  async listActive(prefix: string): Promise<{ key: string; userId: string; ttl: number }[]> {
    const keys = await this.redis.keys(`${prefix}*`);
    if (!keys.length) return [];

    const results = await this.redis.pipeline(
      keys.map(key => ['get', key]),
    ).exec();

    const ttls = await this.redis.pipeline(
      keys.map(key => ['pttl', key]),
    ).exec();

    return keys.map((key, i) => ({
      key,
      userId: results?.[i]?.[1] as string,
      ttl: ttls?.[i]?.[1] as number,
    }));
  }
}
