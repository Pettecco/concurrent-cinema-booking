import type { Request, Response } from 'express';
import type { ILockService } from '../domain/lock-service.js';
import { manipulateLockSchema } from './lock.schema.js';
import { LockNotOwnedError } from '../domain/errors.js';

export class LockController {
  constructor(private readonly lockService: ILockService) {}

  async acquire(req: Request, res: Response) {
    const input = manipulateLockSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ errors: input.error.issues });
    }

    const { movieId, seatId, userId } = input.data;
    const lockKey = `lock:${movieId}:${seatId}`;
    const ttlMS = 300000;

    const acquired = await this.lockService.acquire(lockKey, ttlMS, userId);

    if (!acquired) {
      return res.status(409).json({
        error: {
          code: 'SEAT_LOCKED',
          message: `Seat ${seatId} is already locked`,
        },
      });
    }

    const expiresAt = new Date(Date.now() + ttlMS);
    return res.status(200).json({
      success: true,
      lockKey,
      expiresAt,
    });
  }

  async release(req: Request, res: Response) {
    const input = manipulateLockSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ errors: input.error.issues });
    }

    const { movieId, seatId, userId } = input.data;
    const lockKey = `lock:${movieId}:${seatId}`;

    try {
      await this.lockService.release(lockKey, userId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof LockNotOwnedError) {
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
