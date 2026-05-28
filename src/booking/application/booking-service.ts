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

  async book(booking: Booking): Promise<Booking> {
    const lockKey = `lock:${booking.movieId}:${booking.seatId}`;

    logger.info(
      { lockKey, userId: booking.userId },
      'Verifying lock for booking'
    );

    const hasValidLock = await this.lockService.verify(lockKey, booking.userId);
    if (!hasValidLock) {
      logger.warn(
        {
          lockKey,
          userId: booking.userId,
          movieId: booking.movieId,
          seatId: booking.seatId,
        },
        'Booking attempted without valid lock'
      );
      throw new SeatNotLockedError(booking.movieId, booking.seatId);
    }

    logger.info(
      { lockKey, userId: booking.userId },
      'Lock verified successfully'
    );

    const existing = await this.bookingRepository.findBySeat(
      booking.movieId,
      booking.seatId
    );

    if (existing) {
      logger.warn(
        { movieId: booking.movieId, seatId: booking.seatId },
        'Seat already booked'
      );
      throw new SeatAlreadyBookedError(booking.movieId, booking.seatId);
    }

    const created = await this.bookingRepository.create(booking);

    logger.info(
      {
        bookingId: created.id,
        movieId: booking.movieId,
        seatId: booking.seatId,
      },
      'Booking created successfully, releasing lock'
    );

    await this.lockService.release(lockKey, booking.userId);

    logger.info(
      { bookingId: created.id, lockKey },
      'Lock released after booking'
    );

    return created;
  }

  async listBookings(movieId: string): Promise<Booking[]> {
    return this.bookingRepository.findByMovieId(movieId);
  }

  async findBookingBySeat(
    movieId: string,
    seatId: string
  ): Promise<Booking | null> {
    return this.bookingRepository.findBySeat(movieId, seatId);
  }
}
