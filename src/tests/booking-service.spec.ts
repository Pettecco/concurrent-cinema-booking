import { describe, it, expect, vi, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { BookingService } from '../booking/application/booking-service.js';
import {
  SeatAlreadyBookedError,
  SeatNotLockedError,
} from '../booking/domain/errors.js';

function makeBookingRepository() {
  return {
    create: vi.fn(),
    findByRoomId: vi.fn(),
    findBySeat: vi.fn(),
    book: vi.fn(),
    getBookingDetails: vi.fn(),
  } as unknown as import('../booking/domain/booking-repository.js').IBookingRepository;
}

function makeLockService() {
  return {
    acquire: vi.fn(),
    release: vi.fn(),
    verify: vi.fn(),
  } as unknown as import('../booking/domain/lock-service.js').ILockService;
}

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepo: ReturnType<typeof makeBookingRepository>;
  let lockSvc: ReturnType<typeof makeLockService>;

  beforeEach(() => {
    bookingRepo = makeBookingRepository();
    lockSvc = makeLockService();
    service = new BookingService(bookingRepo, lockSvc);
  });

  describe('book', () => {
    const input = {
      roomId: randomUUID(),
      showtimeId: randomUUID(),
      seatId: 'A1',
      userId: randomUUID(),
      email: 'user@example.com',
      status: 'CONFIRMED',
    };

    it('creates booking when lock is valid', async () => {
      const booking = { id: randomUUID(), ...input };
      vi.mocked(lockSvc.verify).mockResolvedValue(true);
      vi.mocked(bookingRepo.book).mockResolvedValue(booking);
      vi.mocked(lockSvc.release).mockResolvedValue(undefined);

      const result = await service.book(input);

      expect(result).toEqual(booking);
      expect(lockSvc.verify).toHaveBeenCalledWith(
        `lock:${input.roomId}:${input.showtimeId}:${input.seatId}`,
        input.userId
      );
      expect(bookingRepo.book).toHaveBeenCalledWith(input);
      expect(lockSvc.release).toHaveBeenCalledWith(
        `lock:${input.roomId}:${input.showtimeId}:${input.seatId}`,
        input.userId
      );
    });

    it('throws SeatNotLockedError when lock is invalid', async () => {
      vi.mocked(lockSvc.verify).mockResolvedValue(false);

      await expect(service.book(input)).rejects.toThrow(SeatNotLockedError);

      expect(bookingRepo.book).not.toHaveBeenCalled();
      expect(lockSvc.release).not.toHaveBeenCalled();
    });

    it('throws SeatAlreadyBookedError when repo returns null', async () => {
      vi.mocked(lockSvc.verify).mockResolvedValue(true);
      vi.mocked(bookingRepo.book).mockResolvedValue(null);

      await expect(service.book(input)).rejects.toThrow(SeatAlreadyBookedError);

      expect(lockSvc.release).not.toHaveBeenCalled();
    });
  });

  describe('listBookings', () => {
    it('returns bookings from repository', async () => {
      const bookings = [
        {
          id: randomUUID(),
          roomId: randomUUID(),
          showtimeId: randomUUID(),
          seatId: 'A1',
          userId: randomUUID(),
          email: 'a@b.com',
          status: 'CONFIRMED',
        },
      ];
      vi.mocked(bookingRepo.findByRoomId).mockResolvedValue(bookings);

      const result = await service.listBookings('room-1');

      expect(result).toEqual(bookings);
      expect(bookingRepo.findByRoomId).toHaveBeenCalledWith('room-1');
    });
  });

  describe('findBookingBySeat', () => {
    it('returns booking when found', async () => {
      const booking = {
        id: randomUUID(),
        roomId: 'r1',
        showtimeId: 's1',
        seatId: 'A1',
        userId: randomUUID(),
        email: 'a@b.com',
        status: 'CONFIRMED',
      };
      vi.mocked(bookingRepo.findBySeat).mockResolvedValue(booking);

      const result = await service.findBookingBySeat('r1', 'A1');

      expect(result).toEqual(booking);
      expect(bookingRepo.findBySeat).toHaveBeenCalledWith('r1', 'A1');
    });

    it('returns null when not found', async () => {
      vi.mocked(bookingRepo.findBySeat).mockResolvedValue(null);

      const result = await service.findBookingBySeat('r1', 'A1');

      expect(result).toBeNull();
    });
  });

  describe('getBookingDetails', () => {
    it('returns details from repository', async () => {
      const details = {
        movieTitle: 'Test',
        showtime: '2024-01-01',
        seatId: 'A1',
        bookingId: '123',
      };
      vi.mocked(bookingRepo.getBookingDetails).mockResolvedValue(details);

      const result = await service.getBookingDetails('123');

      expect(result).toEqual(details);
      expect(bookingRepo.getBookingDetails).toHaveBeenCalledWith('123');
    });
  });
});
