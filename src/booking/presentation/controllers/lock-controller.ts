import type { Request, Response } from 'express';
import { logger } from '../../../infra/http/logger.js';
import { LockNotOwnedError } from '../../domain/errors.js';
import type { ILockService } from '../../domain/lock-service.js';
import { manipulateLockSchema } from '../schemas/lock.schema.js';

export class LockController {
  constructor(private readonly lockService: ILockService) {}

  async acquire(req: Request, res: Response) {
    const input = manipulateLockSchema.safeParse(req.body);
    if (!input.success) {
      logger.warn(
        {
          movieId: req.body?.movieId,
          seatId: req.body?.seatId,
          errors: input.error.issues,
        },
        'Lock acquisition failed validation'
      );
      return res.status(400).json({ errors: input.error.issues });
    }

    const { movieId, seatId, userId } = input.data;
    const lockKey = `lock:${movieId}:${seatId}`;
    const ttlMS = 300000;

    logger.info({ lockKey, userId }, 'Attempting to acquire lock');

    const acquired = await this.lockService.acquire(lockKey, ttlMS, userId);

    if (!acquired) {
      logger.warn(
        { lockKey, userId, movieId, seatId },
        'Lock already acquired by another user'
      );
      return res.status(409).json({
        error: {
          code: 'SEAT_LOCKED',
          message: `Seat ${seatId} is already locked`,
        },
      });
    }

    const expiresAt = new Date(Date.now() + ttlMS);
    logger.info(
      { lockKey, userId, expiresAt: expiresAt.toISOString() },
      'Lock acquired successfully'
    );
    return res.status(200).json({
      success: true,
      lockKey,
      expiresAt,
    });
  }

  async release(req: Request, res: Response) {
    const input = manipulateLockSchema.safeParse(req.body);
    if (!input.success) {
      logger.warn(
        {
          movieId: req.body?.movieId,
          seatId: req.body?.seatId,
          errors: input.error.issues,
        },
        'Lock release failed validation'
      );
      return res.status(400).json({ errors: input.error.issues });
    }

    const { movieId, seatId, userId } = input.data;
    const lockKey = `lock:${movieId}:${seatId}`;

    logger.info({ lockKey, userId }, 'Attempting to release lock');

    try {
      await this.lockService.release(lockKey, userId);
      logger.info({ lockKey, userId }, 'Lock released successfully');
      return res.status(204).send();
    } catch (error) {
      if (error instanceof LockNotOwnedError) {
        logger.warn(
          { lockKey, userId, movieId, seatId },
          'User attempted to release lock they do not own'
        );
        return res.status(403).json({
          error: {
            code: 'LOCK_NOT_OWNED',
            message: error.message,
          },
        });
      }
      throw error;
    }
  }
}
