import { Mutex } from 'async-mutex';
import type { BookingStore } from './booking-store.js';
import type { Booking } from './booking.js';
import { sleep } from '../utils/sleep.js';

export class ConcurrentMemoryStore implements BookingStore {
  private bookings = new Map<string, Booking>();

  // one mutex for the entire store
  private mutex = new Mutex();

  async book(booking: Booking): Promise<Booking> {
    return this.mutex.runExclusive(async () => {
      const key = `${booking.movieId}:${booking.seatId}`;

      const alreadyBooked = this.bookings.has(key);

      if (alreadyBooked) {
        throw new Error('seat already booked');
      }

      // creates an async gap that allows request interleaving and race conditions
      await sleep(1);

      this.bookings.set(key, booking);

      return booking;
    });
  }

  async listBookings(movieId: string): Promise<Booking[]> {
    return [...this.bookings.values()].filter(
      booking => booking.movieId === movieId
    );
  }
}
