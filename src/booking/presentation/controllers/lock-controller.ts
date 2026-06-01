import type { Request, Response } from 'express';
import { LockNotOwnedError } from '../../domain/errors.js';
import type { ILockService } from '../../domain/lock-service.js';
import { manipulateLockSchema } from '../schemas/lock.schema.js';
import type { Broadcast } from '../../../infra/websocket/broadcast.js';

const LOCK_TTL_MS = 300000; // 5 minutes

export class LockController {
  constructor(
    private readonly lockService: ILockService,
    private readonly broadcast: Broadcast
  ) {}

  async acquire(req: Request, res: Response) {
    const input = manipulateLockSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ errors: input.error.issues });
    }

    const { roomId, showtimeId, seatId, userId } = input.data;
    const lockKey = `lock:${roomId}:${showtimeId}:${seatId}`;

    const acquired = await this.lockService.acquire(
      lockKey,
      LOCK_TTL_MS,
      userId
    );

    if (!acquired) {
      return res.status(409).json({
        message: 'Seat already locked',
        roomId,
        showtimeId,
        seatId,
      });
    }

    this.broadcast.emitSeatLocked(roomId, seatId, userId);

    return res.status(201).json({
      message: 'Lock acquired',
      roomId,
      showtimeId,
      seatId,
      userId,
      expiresAt: Date.now() + LOCK_TTL_MS,
    });
  }

  async release(req: Request, res: Response) {
    const input = manipulateLockSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ errors: input.error.issues });
    }

    const { roomId, showtimeId, seatId, userId } = input.data;
    const lockKey = `lock:${roomId}:${showtimeId}:${seatId}`;

    try {
      await this.lockService.release(lockKey, userId);

      this.broadcast.emitSeatReleased(roomId, seatId, userId);

      return res.status(200).json({
        message: 'Lock released',
        roomId,
        showtimeId,
        seatId,
        userId,
      });
    } catch (error) {
      if (error instanceof LockNotOwnedError) {
        return res.status(403).json({
          message: 'Lock not owned by user',
          roomId,
          showtimeId,
          seatId,
          userId,
        });
      }
      throw error;
    }
  }
}
