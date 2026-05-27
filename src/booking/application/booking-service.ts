import type { IBookingRepository } from '../domain/booking-repository.js';
import type { Booking } from '../domain/booking.js';

export class BookingService {
  constructor(private readonly bookingRepository: IBookingRepository) {}

  async book(booking: Booking) {
    return this.bookingRepository.create(booking);
  }

  async listBookings(movieId: string) {
    return this.bookingRepository.findByMovieId(movieId);
  }

  async findBookingBySeat(movieId: string, seatId: string) {
    return this.bookingRepository.findBySeat(movieId, seatId);
  }
}
