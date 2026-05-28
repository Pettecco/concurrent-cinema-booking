import type { IBookingRepository } from '../domain/booking-repository.js';
import type { Booking } from '../domain/booking.js';
import { randomUUID } from 'crypto';

export class MemoryBookingRepository implements IBookingRepository {
  private store = new Map<string, Booking>();

  async create(booking: Booking): Promise<Booking> {
    const created: Booking = {
      id: booking.id ?? randomUUID(),
      movieId: booking.movieId,
      seatId: booking.seatId,
      userId: booking.userId,
      status: booking.status,
    };
    const uniqueKey = `${booking.movieId}:${booking.seatId}`;
    this.store.set(uniqueKey, created);
    return created;
  }

  async findByMovieId(movieId: string): Promise<Booking[]> {
    return Array.from(this.store.values()).filter(b => b.movieId === movieId);
  }

  async findBySeat(movieId: string, seatId: string): Promise<Booking | null> {
    const uniqueKey = `${movieId}:${seatId}`;
    return this.store.get(uniqueKey) ?? null;
  }

  async book(booking: Booking): Promise<Booking | null> {
    const uniqueKey = `${booking.movieId}:${booking.seatId}`;
    if (this.store.has(uniqueKey)) {
      return null;
    }
    const created: Booking = {
      id: booking.id ?? randomUUID(),
      movieId: booking.movieId,
      seatId: booking.seatId,
      userId: booking.userId,
      status: booking.status,
    };
    this.store.set(uniqueKey, created);
    return created;
  }

  clear(): void {
    this.store.clear();
  }
}
