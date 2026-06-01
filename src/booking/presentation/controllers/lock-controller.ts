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

  /**
   * @openapi
   * /locks/acquire:
   *   post:
   *     summary: Acquire seat lock
   *     description: Locks a seat for 5 minutes. User must release or it expires automatically.
   *     tags: [Locks]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - roomId
   *               - showtimeId
   *               - seatId
   *               - userId
   *             properties:
   *               roomId:
   *                 type: string
   *                 format: uuid
   *                 example: '660e8400-e29b-41d4-a716-446655440001'
   *               showtimeId:
   *                 type: string
   *                 format: uuid
   *                 example: '8fa5eeb0-3bc4-4182-9cb9-7ba8f55ae873'
   *               seatId:
   *                 type: string
   *                 example: 'A1'
   *               userId:
   *                 type: string
   *                 format: uuid
   *                 example: '550e8400-e29b-41d4-a716-446655440100'
   *     responses:
   *       201:
   *         description: Lock acquired
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Lock'
   *       400:
   *         description: Invalid input
   *       409:
   *         description: Seat already locked
   */
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

    const expiresAt = new Date(Date.now() + LOCK_TTL_MS);

    this.broadcast.emitSeatLocked(roomId, seatId, userId, expiresAt);

    return res.status(201).json({
      message: 'Lock acquired',
      roomId,
      showtimeId,
      seatId,
      userId,
      expiresAt: expiresAt.getTime(),
    });
  }

  /**
   * @openapi
   * /locks/release:
   *   post:
   *     summary: Release seat lock
   *     description: Releases a lock on a seat. Only the user who acquired the lock can release it.
   *     tags: [Locks]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - roomId
   *               - showtimeId
   *               - seatId
   *               - userId
   *             properties:
   *               roomId:
   *                 type: string
   *                 format: uuid
   *               showtimeId:
   *                 type: string
   *                 format: uuid
   *               seatId:
   *                 type: string
   *               userId:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       200:
   *         description: Lock released successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 roomId:
   *                   type: string
   *                 showtimeId:
   *                   type: string
   *                 seatId:
   *                   type: string
   *                 userId:
   *                   type: string
   *       400:
   *         description: Invalid input
   *       403:
   *         description: Lock not owned by user
   */
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
