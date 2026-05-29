import type { Booking } from './booking.js';

export interface IBookingRepository {
  /**
   * Creates a new booking record.
   * @param booking - The booking entity to create.
   * @returns The created booking entity.
   */
  create(booking: Booking): Promise<Booking>;

  /**
   * Finds all bookings for a specific movie.
   * @param movieId - The ID of the movie.
   * @returns Array of bookings associated with the movie.
   */
  findByMovieId(movieId: string): Promise<Booking[]>;

  /**
   * Finds a booking for a specific seat in a movie.
   * @param movieId - The ID of the movie.
   * @param seatId - The ID of the seat.
   * @returns The booking if found, otherwise null.
   */
  findBySeat(movieId: string, seatId: string): Promise<Booking | null>;

  /**
   * Books a seat by updating or creating a booking.
   * @param booking - The booking entity with seat information.
   * @returns The updated booking if successful, otherwise null.
   */
  book(booking: Booking): Promise<Booking | null>;
}
