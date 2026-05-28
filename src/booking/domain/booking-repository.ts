import type { Booking } from './booking.js';

export interface IBookingRepository {
  create(booking: Booking): Promise<Booking>;
  findByMovieId(movieId: string): Promise<Booking[]>;
  findBySeat(movieId: string, seatId: string): Promise<Booking | null>;
  book(booking: Booking): Promise<Booking | null>;
}
