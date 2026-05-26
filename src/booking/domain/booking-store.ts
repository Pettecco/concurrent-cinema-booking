import type { Booking } from './booking.js';

export interface BookingStore {
  book(booking: Booking): Promise<Booking>;

  listBookings(movieId: string): Promise<Booking[]>;
}
