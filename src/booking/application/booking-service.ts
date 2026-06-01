import type { IBookingRepository } from '../domain/booking-repository.js';
import type { ILockService } from '../domain/lock-service.js';
import type { Booking } from '../domain/booking.js';
import {
  SeatAlreadyBookedError,
  SeatNotLockedError,
} from '../domain/errors.js';
import { logger } from '../../infra/http/logger.js';

export class BookingService {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly lockService: ILockService
  ) {}

  async book(input: Omit<Booking, 'id'>): Promise<Booking> {
    const lockKey = `lock:${input.roomId}:${input.showtimeId}:${input.seatId}`;

    logger.info(
      { lockKey, userId: input.userId },
      'Verifying lock for booking'
    );

    const hasValidLock = await this.lockService.verify(lockKey, input.userId);
    if (!hasValidLock) {
      logger.warn(
        {
          lockKey,
          userId: input.userId,
          roomId: input.roomId,
          showtimeId: input.showtimeId,
          seatId: input.seatId,
        },
        'Booking attempted without valid lock'
      );
      throw new SeatNotLockedError(input.roomId, input.seatId);
    }

    logger.info(
      { lockKey, userId: input.userId },
      'Lock verified successfully'
    );

    const created = await this.bookingRepository.book(input);

    if (!created) {
      logger.warn(
        { roomId: input.roomId, showtimeId: input.showtimeId, seatId: input.seatId },
        'Seat already booked'
      );
      throw new SeatAlreadyBookedError(input.roomId, input.seatId);
    }

    logger.info(
      {
        bookingId: created.id,
        roomId: input.roomId,
        showtimeId: input.showtimeId,
        seatId: input.seatId,
      },
      'Booking created successfully, releasing lock'
    );

    await this.lockService.release(lockKey, input.userId);

    logger.info(
      { bookingId: created.id, lockKey },
      'Lock released after booking'
    );

    return created;
  }

  async listBookings(roomId: string): Promise<Booking[]> {
    return this.bookingRepository.findByRoomId(roomId);
  }

  async findBookingBySeat(
    roomId: string,
    seatId: string
  ): Promise<Booking | null> {
    return this.bookingRepository.findBySeat(roomId, seatId);
  }

  async getBookingDetails(bookingId: string) {
    return this.bookingRepository.getBookingDetails(bookingId);
  }
}
