import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { LockController } from '../booking/presentation/controllers/lock-controller.js';
import { MemoryLockService } from '../booking/repositories/memory-lock-service.js';
import type { Broadcast } from '../infra/websocket/broadcast.js';

function makeReq(body: Record<string, unknown>) {
  return { body } as unknown as import('express').Request;
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res as unknown as import('express').Response & typeof res;
}

function makeBroadcast() {
  return {
    emitSeatLocked: vi.fn(),
    emitSeatReleased: vi.fn(),
    emitSeatBooked: vi.fn(),
    emitLockExpired: vi.fn(),
  } as unknown as Broadcast & ReturnType<typeof vi.fn> extends infer T
    ? T
    : never;
}

describe('LockController', () => {
  let lockService: MemoryLockService;
  let broadcast: ReturnType<typeof makeBroadcast>;
  let controller: LockController;

  beforeEach(() => {
    lockService = new MemoryLockService();
    broadcast = makeBroadcast();
    controller = new LockController(lockService, broadcast);
  });

  describe('acquire', () => {
    it('returns 200 with lock info when acquired', async () => {
      const movieId = randomUUID();
      const req = makeReq({ movieId, seatId: 'A1', userId: randomUUID() });
      const res = makeRes();

      await controller.acquire(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('emits seat_locked event on success', async () => {
      const movieId = randomUUID();
      const seatId = 'A1';
      const userId = randomUUID();
      const req = makeReq({ movieId, seatId, userId });
      const res = makeRes();

      await controller.acquire(req, res);

      expect(broadcast.emitSeatLocked).toHaveBeenCalledWith(
        movieId,
        seatId,
        userId,
        expect.any(Date)
      );
    });

    it('returns 409 when lock is already held', async () => {
      const movieId = randomUUID();
      const userId1 = randomUUID();
      const userId2 = randomUUID();

      await lockService.acquire(`lock:${movieId}:A1`, 300_000, userId1);

      const req = makeReq({ movieId, seatId: 'A1', userId: userId2 });
      const res = makeRes();

      await controller.acquire(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'SEAT_LOCKED' }),
        })
      );
    });

    it('returns 400 on invalid input', async () => {
      const req = makeReq({ movieId: 'not-uuid', seatId: 'A1', userId: 'bad' });
      const res = makeRes();

      await controller.acquire(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('release', () => {
    it('returns 204 when released successfully', async () => {
      const movieId = randomUUID();
      const userId = randomUUID();

      await lockService.acquire(`lock:${movieId}:A1`, 300_000, userId);

      const req = makeReq({ movieId, seatId: 'A1', userId });
      const res = makeRes();

      await controller.release(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('emits seat_released event on success', async () => {
      const movieId = randomUUID();
      const userId = randomUUID();

      await lockService.acquire(`lock:${movieId}:A1`, 300_000, userId);

      const req = makeReq({ movieId, seatId: 'A1', userId });
      const res = makeRes();

      await controller.release(req, res);

      expect(broadcast.emitSeatReleased).toHaveBeenCalledWith(movieId, 'A1');
    });

    it('returns 403 when user does not own the lock', async () => {
      const movieId = randomUUID();
      const userId = randomUUID();

      await lockService.acquire(`lock:${movieId}:A1`, 300_000, userId);

      const req = makeReq({ movieId, seatId: 'A1', userId: randomUUID() });
      const res = makeRes();

      await controller.release(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ code: 'LOCK_NOT_OWNED' }),
        })
      );
    });

    it('returns 400 on invalid input', async () => {
      const req = makeReq({ movieId: 'bad', seatId: '', userId: 'bad' });
      const res = makeRes();

      await controller.release(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
