import type { Request, Response } from 'express';
import { LockNotOwnedError } from '../../domain/errors.js';
import type { ILockService } from '../../domain/lock-service.js';
import { manipulateLockSchema } from '../schemas/lock.schema.js';
import type { Broadcast } from '../../../infra/websocket/broadcast.js';
import { AuditService } from '../../../audit/application/audit-service.js';

const LOCK_TTL_MS = 300000; // 5 minutes

export class LockController {
  constructor(
    private readonly lockService: ILockService,
    private readonly broadcast: Broadcast,
    private readonly auditService: AuditService
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
      await this.auditService.emit('lock.conflict', {
        roomId,
        showtimeId,
        seatId,
        userId,
        reason: 'already_locked',
      });

      return res.status(409).json({
        message: 'Seat already locked',
        roomId,
        showtimeId,
        seatId,
      });
    }

    const expiresAt = new Date(Date.now() + LOCK_TTL_MS);

    this.broadcast.emitSeatLocked(roomId, seatId, userId, expiresAt);

    await this.auditService.emit('lock.acquired', {
      roomId,
      showtimeId,
      seatId,
      userId,
      expiresAt: expiresAt.getTime(),
    });

    return res.status(201).json({
      message: 'Lock acquired',
      roomId,
      showtimeId,
      seatId,
      userId,
      expiresAt: expiresAt.getTime(),
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

      this.broadcast.emitSeatReleased(roomId, seatId);

      await this.auditService.emit('lock.released', {
        roomId,
        showtimeId,
        seatId,
        userId,
      });

      return res.status(200).json({
        message: 'Lock released',
        roomId,
        showtimeId,
        seatId,
        userId,
      });
    } catch (error) {
      if (error instanceof LockNotOwnedError) {
        await this.auditService.emit('lock.forbidden', {
          roomId,
          showtimeId,
          seatId,
          userId,
          reason: 'lock_not_owned',
        });

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
