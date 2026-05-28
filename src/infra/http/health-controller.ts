import type { Request, Response } from 'express';
import type { Knex } from 'knex';
import type { Redis } from 'ioredis';
import { logger } from './logger.js';

export class HealthController {
  constructor(
    private readonly db: Knex,
    private readonly redis: Redis
  ) {}

  async check(_req: Request, res: Response) {
    const checks = await Promise.allSettled([
      this.checkPostgres(),
      this.checkRedis(),
    ]);

    const [postgres, redis] = checks;

    const status =
      postgres.status === 'fulfilled' && redis.status === 'fulfilled'
        ? 'ok'
        : 'error';

    const statusCode = status === 'ok' ? 200 : 503;

    res.status(statusCode).json({
      status,
      checks: {
        postgres:
          postgres.status === 'fulfilled'
            ? { status: 'ok' }
            : { status: 'error', error: postgres.reason.message },
        redis:
          redis.status === 'fulfilled'
            ? { status: 'ok' }
            : { status: 'error', error: redis.reason.message },
      },
    });
  }

  private async checkPostgres() {
    await this.db.raw('SELECT 1');
  }

  private async checkRedis() {
    const result = await this.redis.ping();
    if (result !== 'PONG') {
      throw new Error(`Redis ping returned: ${result}`);
    }
  }
}
