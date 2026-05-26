import { redis } from '../../infra/redis/client.js';
import type { Booking } from '../domain/booking.js';
import type { BookingStore } from '../domain/booking-store.js';

export class RedisLockMemoryStore implements BookingStore {
  private bookings = new Map<string, Booking>();

  async book(booking: Booking): Promise<Booking> {
    const key = `${booking.movieId}:${booking.seatId}`;

    const lockKey = `lock:${key}`;

    const acquired = await redis.set(lockKey, 'locked', 'PX', 300000, 'NX');

    if (!acquired) {
      throw new Error('seat is locked');
    }

    try {
      const alreadyBooked = this.bookings.has(key);

      if (alreadyBooked) {
        throw new Error('seat already booked');
      }

      this.bookings.set(key, booking);

      return booking;
    } finally {
      await redis.del(lockKey);
    }
  }

  async listBookings(movieId: string): Promise<Booking[]> {
    return [...this.bookings.values()].filter(
      booking => booking.movieId === movieId
    );
  }
}
