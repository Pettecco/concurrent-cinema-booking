import type { Request, Response } from 'express';
import { logger } from '../../../infra/http/logger.js';
import { LockNotOwnedError } from '../../domain/errors.js';
import type { ILockService } from '../../domain/lock-service.js';
import { manipulateLockSchema } from '../schemas/lock.schema.js';
import type { Broadcast } from '../../../infra/websocket/broadcast.js';

export class LockController {
  constructor(
    private readonly lockService: ILockService,
    private readonly broadcast: Broadcast
  ) {}

  async acquire(req: Request, res: Response) {
    const input = manipulateLockSchema.safeParse(req.body);
    if (!input.success) {
      logger.warn(
        {
          roomId: req.body?.roomId,
          seatId: req.body?.seatId,
          errors: input.error.issues,
        },
        'Lock acquisition failed validation'
      );
      return res.status(400).json({ errors: input.error.issues });
    }

    const { roomId, seatId, userId } = input.data;
    const lockKey = `lock:${roomId}:${seatId}`;
    const ttlMS = 300000;

    logger.info({ lockKey, userId }, 'Attempting to acquire lock');

    const acquired = await this.lockService.acquire(lockKey, ttlMS, userId);

    if (!acquired) {
      logger.warn(
        { lockKey, userId, roomId, seatId },
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

    this.broadcast.emitSeatLocked(roomId, seatId, userId, expiresAt);

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
          roomId: req.body?.roomId,
          seatId: req.body?.seatId,
          errors: input.error.issues,
        },
        'Lock release failed validation'
      );
      return res.status(400).json({ errors: input.error.issues });
    }

    const { roomId, seatId, userId } = input.data;
    const lockKey = `lock:${roomId}:${seatId}`;

    logger.info({ lockKey, userId }, 'Attempting to release lock');

    try {
      await this.lockService.release(lockKey, userId);
      logger.info({ lockKey, userId }, 'Lock released successfully');

      this.broadcast.emitSeatReleased(roomId, seatId);

      return res.status(204).send();
    } catch (error) {
      if (error instanceof LockNotOwnedError) {
        logger.warn(
          { lockKey, userId, roomId, seatId },
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
