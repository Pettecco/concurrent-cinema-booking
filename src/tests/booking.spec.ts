import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { BookingService } from '../booking/application/booking-service.js';
import { MemoryLockService } from '../booking/repositories/memory-lock-service.js';
import { MemoryBookingRepository } from '../booking/repositories/memory-booking-repository.js';
import {
  SeatAlreadyBookedError,
  SeatNotLockedError,
  LockNotOwnedError,
} from '../booking/domain/errors.js';

function makeBooking(overrides?: { userId?: string; seatId?: string; showtimeId?: string }) {
  return {
    id: randomUUID(),
    roomId: randomUUID(),
    showtimeId: overrides?.showtimeId ?? randomUUID(),
    seatId: overrides?.seatId ?? 'A1',
    userId: overrides?.userId ?? randomUUID(),
    status: 'CONFIRMED',
  };
}

describe('BookingService', () => {
  let lockService: MemoryLockService;
  let bookingRepository: MemoryBookingRepository;
  let service: BookingService;

  beforeEach(() => {
    lockService = new MemoryLockService();
    bookingRepository = new MemoryBookingRepository();
    service = new BookingService(bookingRepository, lockService);
  });

  describe('book', () => {
    it('creates a booking when user has valid lock', async () => {
      const booking = makeBooking();
      const lockKey = `lock:${booking.roomId}:${booking.showtimeId}:${booking.seatId}`;

      await lockService.acquire(lockKey, 300_000, booking.userId);

      const result = await service.book(booking);

      expect(result.id).toBe(booking.id);
      expect(result.seatId).toBe(booking.seatId);
      expect(result.userId).toBe(booking.userId);
    });

    it('throws SeatNotLockedError when user has no lock', async () => {
      const booking = makeBooking();

      await expect(service.book(booking)).rejects.toThrow(SeatNotLockedError);
    });

    it('throws SeatNotLockedError when lock belongs to another user', async () => {
      const booking = makeBooking();

      await lockService.acquire(
        `lock:${booking.roomId}:${booking.showtimeId}:${booking.seatId}`,
        300_000,
        'another-user-id'
      );

      await expect(service.book(booking)).rejects.toThrow(SeatNotLockedError);
    });

    it('throws SeatAlreadyBookedError when seat is already booked for same showtime', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();
      const seatId = 'A1';

      const booking = makeBooking({ seatId, showtimeId });
      booking.roomId = roomId;

      await lockService.acquire(
        `lock:${roomId}:${showtimeId}:${seatId}`,
        300_000,
        booking.userId
      );

      await service.book(booking);

      const secondUserId = randomUUID();
      await lockService.acquire(
        `lock:${roomId}:${showtimeId}:${seatId}`,
        300_000,
        secondUserId
      );

      const secondBooking = makeBooking({ seatId, userId: secondUserId, showtimeId });
      secondBooking.roomId = roomId;

      await expect(service.book(secondBooking)).rejects.toThrow(
        SeatAlreadyBookedError
      );
    });

    it('releases lock after successful booking', async () => {
      const booking = makeBooking();
      const lockKey = `lock:${booking.roomId}:${booking.showtimeId}:${booking.seatId}`;

      await lockService.acquire(lockKey, 300_000, booking.userId);
      await service.book(booking);

      const stillLocked = await lockService.verify(lockKey, booking.userId);
      expect(stillLocked).toBe(false);
    });

    it('allows different users to book different seats for the same showtime', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();

      const booking1 = makeBooking({ seatId: 'A1', showtimeId });
      booking1.roomId = roomId;

      const booking2 = makeBooking({ seatId: 'A2', showtimeId });
      booking2.roomId = roomId;

      await lockService.acquire(`lock:${roomId}:${showtimeId}:A1`, 300_000, booking1.userId);
      await lockService.acquire(`lock:${roomId}:${showtimeId}:A2`, 300_000, booking2.userId);

      const result1 = await service.book(booking1);
      const result2 = await service.book(booking2);

      expect(result1.seatId).toBe('A1');
      expect(result2.seatId).toBe('A2');
      expect(result1.showtimeId).toBe(showtimeId);
      expect(result2.showtimeId).toBe(showtimeId);
    });

    it('throws LockNotOwnedError when releasing a lock owned by another user', async () => {
      const booking = makeBooking();
      const lockKey = `lock:${booking.roomId}:${booking.showtimeId}:${booking.seatId}`;

      await lockService.acquire(lockKey, 300_000, booking.userId);

      await expect(
        lockService.release(lockKey, 'another-user')
      ).rejects.toThrow(LockNotOwnedError);
    });
  });

  describe('listBookings', () => {
    it('returns all bookings for a room', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();

      const booking1 = makeBooking({ seatId: 'A1', showtimeId });
      booking1.roomId = roomId;

      const booking2 = makeBooking({ seatId: 'A2', showtimeId });
      booking2.roomId = roomId;

      await lockService.acquire(`lock:${roomId}:${showtimeId}:A1`, 300_000, booking1.userId);
      await lockService.acquire(`lock:${roomId}:${showtimeId}:A2`, 300_000, booking2.userId);

      await service.book(booking1);
      await service.book(booking2);

      const bookings = await service.listBookings(roomId);

      expect(bookings).toHaveLength(2);
      expect(bookings.map(b => b.seatId)).toContain('A1');
      expect(bookings.map(b => b.seatId)).toContain('A2');
    });

    it('returns empty array when no bookings exist', async () => {
      const bookings = await service.listBookings(randomUUID());
      expect(bookings).toHaveLength(0);
    });
  });

  describe('concurrent bookings', () => {
    it('exactly one succeeds when 100 users try to book the same seat', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();
      const seatId = 'A1';
      const concurrency = 100;

      let success = 0;
      let seatNotLocked = 0;
      let seatAlreadyBooked = 0;

      await Promise.all(
        Array.from({ length: concurrency }, async () => {
          const userId = randomUUID();
          const lockKey = `lock:${roomId}:${showtimeId}:${seatId}`;

          try {
            const acquired = await lockService.acquire(
              lockKey,
              300_000,
              userId
            );
            if (!acquired) {
              seatNotLocked++;
              return;
            }

            await service.book({
              id: randomUUID(),
              roomId,
              showtimeId,
              seatId,
              userId,
              status: 'CONFIRMED',
            });
            success++;
          } catch (error) {
            if (error instanceof SeatAlreadyBookedError) {
              seatAlreadyBooked++;
            } else if (error instanceof SeatNotLockedError) {
              seatNotLocked++;
            }
          }
        })
      );

      expect(success).toBe(1);
      expect(seatAlreadyBooked + seatNotLocked).toBe(concurrency - 1);
    });

    it('different seats can be booked concurrently without conflicts', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();
      const seats = ['A1', 'A2', 'A3', 'A4', 'A5'];

      const results = await Promise.all(
        seats.map(async seatId => {
          const userId = randomUUID();
          const lockKey = `lock:${roomId}:${showtimeId}:${seatId}`;

          await lockService.acquire(lockKey, 300_000, userId);

          return service.book({
            id: randomUUID(),
            roomId,
            showtimeId,
            seatId,
            userId,
            status: 'CONFIRMED',
          });
        })
      );

      expect(results).toHaveLength(5);
      expect(results.map(r => r.seatId).sort()).toEqual(seats.sort());
    });
  });
});
