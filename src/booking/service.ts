import type { BookingStore } from './stores/booking-store.js';
import type { Booking } from './booking.js';

export class Service {
  constructor(private readonly store: BookingStore) {}

  async book(booking: Booking) {
    await this.store.book(booking);
  }
}
