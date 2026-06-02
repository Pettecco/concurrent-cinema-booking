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

function makeLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

function makeEmailService() {
  return {
    sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
  };
}

function makeAuditService() {
  return {
    emit: vi.fn().mockResolvedValue(undefined),
  };
}

describe('BookingController', () => {
  let broadcast: ReturnType<typeof makeBroadcast>;
  let emailService: ReturnType<typeof makeEmailService>;
  let auditService: ReturnType<typeof makeAuditService>;
  let logger: ReturnType<typeof makeLogger>;

  beforeEach(() => {
    broadcast = makeBroadcast();
    emailService = makeEmailService();
    auditService = makeAuditService();
    logger = makeLogger();
  });

  describe('create', () => {
    it('returns 201 with booking when lock is valid', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();
      const userId = randomUUID();
      const email = 'user@example.com';
      const lockService = new MemoryLockService();

      await lockService.acquire(`lock:${roomId}:${showtimeId}:A1`, 300_000, userId);

      const svc = new BookingService(
        new MemoryBookingRepository(),
        lockService,
        logger as any
      );
      const ctrl = new BookingController(svc, broadcast, emailService as any, auditService as any);

      const req = makeReq({ roomId, showtimeId, seatId: 'A1', userId, email });
      const res = makeRes();

      await ctrl.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          roomId,
          showtimeId,
          seatId: 'A1',
          userId,
          email,
          status: 'CONFIRMED',
        })
      );
    });

    it('emits seat_booked event on success', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();
      const userId = randomUUID();
      const email = 'user@example.com';
      const lockService = new MemoryLockService();

      await lockService.acquire(`lock:${roomId}:${showtimeId}:A1`, 300_000, userId);

      const svc = new BookingService(
        new MemoryBookingRepository(),
        lockService,
        logger as any
      );
      const ctrl = new BookingController(svc, broadcast, emailService as any, auditService as any);

      const req = makeReq({ roomId, showtimeId, seatId: 'A1', userId, email });
      const res = makeRes();

      await ctrl.create(req, res);

      expect(broadcast.emitSeatBooked).toHaveBeenCalledWith(
        roomId,
        'A1',
        userId
      );
    });

    it('throws SeatNotLockedError when no lock exists', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();
      const userId = randomUUID();
      const email = 'user@example.com';
      const lockService = new MemoryLockService();

      const svc = new BookingService(
        new MemoryBookingRepository(),
        lockService,
        logger as any
      );
      const ctrl = new BookingController(svc, broadcast, emailService as any, auditService as any);

      const req = makeReq({ roomId, showtimeId, seatId: 'A1', userId, email });
      const res = makeRes();

      await expect(ctrl.create(req, res)).rejects.toThrow(/not locked/);
    });

    it('returns 400 on invalid input', async () => {
      const lockService = new MemoryLockService();
      const svc = new BookingService(
        new MemoryBookingRepository(),
        lockService,
        logger as any
      );
      const ctrl = new BookingController(svc, broadcast, emailService as any, auditService as any);

      const req = makeReq({ roomId: 'bad', seatId: '', userId: 'bad', showtimeId: 'bad', email: 'bad' });
      const res = makeRes();

      await ctrl.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('listByRoom', () => {
    it('returns 200 with bookings array', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();
      const userId = randomUUID();
      const email = 'user@example.com';
      const lockService = new MemoryLockService();

      await lockService.acquire(`lock:${roomId}:${showtimeId}:A1`, 300_000, userId);

      const svc = new BookingService(
        new MemoryBookingRepository(),
        lockService,
        logger as any
      );
      const ctrl = new BookingController(svc, broadcast, emailService as any, auditService as any);

      await ctrl.create(makeReq({ roomId, showtimeId, seatId: 'A1', userId, email }), makeRes());

      const req = makeReq({}, { roomId: roomId });
      const res = makeRes();

      await ctrl.listByRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it('returns 400 on invalid roomId', async () => {
      const lockService = new MemoryLockService();
      const svc = new BookingService(
        new MemoryBookingRepository(),
        lockService,
        logger as any
      );
      const ctrl = new BookingController(svc, broadcast, emailService as any, auditService as any);

      const req = makeReq({}, { roomId: 'not-uuid' });
      const res = makeRes();

      await ctrl.listByRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
