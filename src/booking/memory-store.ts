import type { BookingStore } from './booking-store.js';
import type { Booking } from './booking.js';

export class MemoryStore implements BookingStore {
  book(booking: Booking): Promise<Booking> {
    throw new Error('Method not implemented.');
  }
  listBookings(movieId: string): Promise<Booking[]> {
    throw new Error('Method not implemented.');
  }
}
