import type { BookingStore } from '../domain/booking-store.js';
import type { Booking } from '../domain/booking.js';

export class BookingService {
  constructor(private readonly store: BookingStore) {}

  async book(booking: Booking) {
    await this.store.book(booking);
  }
}
