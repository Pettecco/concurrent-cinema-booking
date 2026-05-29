import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { BookingController } from '../booking/presentation/controllers/booking-controller.js';
import { BookingService } from '../booking/application/booking-service.js';
import { MemoryBookingRepository } from '../booking/repositories/memory-booking-repository.js';
import { MemoryLockService } from '../booking/repositories/memory-lock-service.js';
import type { Broadcast } from '../infra/websocket/broadcast.js';

function makeReq(
  body: Record<string, unknown>,
  params?: Record<string, string>
) {
  return {
    body,
    params: params ?? {},
  } as unknown as import('express').Request;
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
  } as unknown as Broadcast;
}

describe('BookingController', () => {
  let service: BookingService;
  let broadcast: ReturnType<typeof makeBroadcast>;
  let controller: BookingController;

  beforeEach(() => {
    const repo = new MemoryBookingRepository();
    const lockService = new MemoryLockService();
    service = new BookingService(repo, lockService);
    broadcast = makeBroadcast();
    controller = new BookingController(service, broadcast);
  });

  describe('create', () => {
    it('returns 201 with booking when lock is valid', async () => {
      const movieId = randomUUID();
      const userId = randomUUID();
      const lockService = new MemoryLockService();

      await lockService.acquire(`lock:${movieId}:A1`, 300_000, userId);

      const svc = new BookingService(
        new MemoryBookingRepository(),
        lockService
      );
      const ctrl = new BookingController(svc, broadcast);

      const req = makeReq({ movieId, seatId: 'A1', userId });
      const res = makeRes();

      await ctrl.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          movieId,
          seatId: 'A1',
          userId,
          status: 'CONFIRMED',
        })
      );
    });

    it('emits seat_booked event on success', async () => {
      const movieId = randomUUID();
      const userId = randomUUID();
      const lockService = new MemoryLockService();

      await lockService.acquire(`lock:${movieId}:A1`, 300_000, userId);

      const svc = new BookingService(
        new MemoryBookingRepository(),
        lockService
      );
      const ctrl = new BookingController(svc, broadcast);

      const req = makeReq({ movieId, seatId: 'A1', userId });
      const res = makeRes();

      await ctrl.create(req, res);

      expect(broadcast.emitSeatBooked).toHaveBeenCalledWith(
        movieId,
        'A1',
        userId
      );
    });

    it('throws SeatNotLockedError when no lock exists', async () => {
      const movieId = randomUUID();
      const userId = randomUUID();

      const req = makeReq({ movieId, seatId: 'A1', userId });
      const res = makeRes();

      await expect(controller.create(req, res)).rejects.toThrow(/not locked/);
    });

    it('returns 400 on invalid input', async () => {
      const req = makeReq({ movieId: 'bad', seatId: '', userId: 'bad' });
      const res = makeRes();

      await controller.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('listByMovie', () => {
    it('returns 200 with bookings array', async () => {
      const movieId = randomUUID();
      const userId = randomUUID();
      const lockService = new MemoryLockService();

      await lockService.acquire(`lock:${movieId}:A1`, 300_000, userId);

      const svc = new BookingService(
        new MemoryBookingRepository(),
        lockService
      );
      const ctrl = new BookingController(svc, broadcast);

      await ctrl.create(makeReq({ movieId, seatId: 'A1', userId }), makeRes());

      const req = makeReq({}, { movieId });
      const res = makeRes();

      await ctrl.listByMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it('returns 400 on invalid movieId', async () => {
      const req = makeReq({}, { movieId: 'not-uuid' });
      const res = makeRes();

      await controller.listByMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
