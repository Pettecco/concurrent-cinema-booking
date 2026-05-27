import type { BookingStore } from '../domain/booking-store.js';
import type { Booking } from '../domain/booking.js';

export class BookingService {
  constructor(private readonly store: BookingStore) {}

  async book(booking: Booking) {
    return this.store.book(booking);
  }

  async listBookings(movieId: string) {
    return this.store.listBookings(movieId);
  }
}
