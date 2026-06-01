import type { Request, Response } from 'express';
import type { Knex } from 'knex';
import type { Redis } from 'ioredis';

export class HealthController {
  constructor(
    private readonly db: Knex,
    private readonly redis: Redis
  ) {}

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Health check
   *     description: Checks the health status of the API and its dependencies (PostgreSQL, Redis)
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: All systems healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: 'ok'
   *                 checks:
   *                   type: object
   *                   properties:
   *                     postgres:
   *                       type: object
   *                       properties:
   *                         status:
   *                           type: string
   *                           example: 'ok'
   *                     redis:
   *                       type: object
   *                       properties:
   *                         status:
   *                           type: string
   *                           example: 'ok'
   *       503:
   *         description: Service unavailable
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: 'error'
   *                 checks:
   *                   type: object
   */
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
