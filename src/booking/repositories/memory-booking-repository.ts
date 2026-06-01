import type { IBookingRepository } from '../domain/booking-repository.js';
import type { Booking } from '../domain/booking.js';
import { randomUUID } from 'crypto';

export class MemoryBookingRepository implements IBookingRepository {
  private store = new Map<string, Booking>();

  async create(booking: Booking): Promise<Booking> {
    const created: Booking = {
      id: booking.id ?? randomUUID(),
      roomId: booking.roomId,
      showtimeId: booking.showtimeId,
      seatId: booking.seatId,
      userId: booking.userId,
      status: booking.status,
    };
    const uniqueKey = `${booking.id}`;
    this.store.set(uniqueKey, created);
    return created;
  }

  async findByRoomId(roomId: string): Promise<Booking[]> {
    return Array.from(this.store.values()).filter(b => b.roomId === roomId);
  }

  async findBySeat(roomId: string, seatId: string): Promise<Booking | null> {
    const entries = Array.from(this.store.entries());
    const found = entries.find(([_, b]) => b.roomId === roomId && b.seatId === seatId);
    return found ? found[1] : null;
  }

  async book(booking: Booking): Promise<Booking | null> {
    const uniqueKey = `${booking.showtimeId}:${booking.seatId}`;
    if (this.store.has(uniqueKey)) {
      return null;
    }
    const created: Booking = {
      id: booking.id ?? randomUUID(),
      roomId: booking.roomId,
      showtimeId: booking.showtimeId,
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
