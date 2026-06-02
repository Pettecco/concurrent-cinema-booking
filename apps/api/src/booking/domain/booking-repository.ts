import type { Booking } from './booking.js';

export interface IBookingRepository {
  /**
   * Creates a new booking if the seat is available.
   * @param booking - The booking to create (without id)
   * @returns The created booking, or null if the seat is already booked
   */
  book(booking: Omit<Booking, 'id'>): Promise<Booking | null>;

  /**
   * Finds all bookings for a specific room.
   * @param roomId - The room ID to search by
   * @returns Array of bookings for the room
   */
  findByRoomId(roomId: string): Promise<Booking[]>;

  /**
   * Finds a booking by room and seat.
   * @param roomId - The room ID
   * @param seatId - The seat identifier
   * @returns The booking if found, null otherwise
   */
  findBySeat(roomId: string, seatId: string): Promise<Booking | null>;

  /**
   * Gets booking details with movie and showtime info.
   * @param bookingId - The booking ID
   * @returns Booking details with movie title, showtime, and seat
   */
  getBookingDetails(bookingId: string): Promise<{
    movieTitle: string;
    showtime: string;
    seatId: string;
    bookingId: string;
  }>;
}
