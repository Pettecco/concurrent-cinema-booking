import type { IBookingRepository } from '../domain/booking-repository.js';
import type { Booking } from '../domain/booking.js';

export class MemoryBookingRepository implements IBookingRepository {
  private store = new Map<string, Booking>();
  private byId = new Map<string, Booking>();

  async create(booking: Booking): Promise<Booking> {
    this.store.set(booking.id, booking);
    this.byId.set(booking.id, booking);
    return booking;
  }

  async findByRoomId(roomId: string): Promise<Booking[]> {
    return Array.from(this.store.values()).filter((b) => b.roomId === roomId);
  }

  async findBySeat(roomId: string, seatId: string): Promise<Booking | null> {
    const entries = Array.from(this.store.entries());
    const found = entries.find(
      ([_, b]) => b.roomId === roomId && b.seatId === seatId
    );
    return found ? found[1] : null;
  }

  async book(booking: Omit<Booking, 'id'>): Promise<Booking | null> {
    const uniqueKey = `${booking.showtimeId}:${booking.seatId}`;
    if (this.store.has(uniqueKey)) {
      return null;
    }
    const id = crypto.randomUUID();
    const created: Booking = {
      id,
      roomId: booking.roomId,
      showtimeId: booking.showtimeId,
      seatId: booking.seatId,
      userId: booking.userId,
      email: booking.email,
      status: booking.status,
    };
    this.store.set(uniqueKey, created);
    this.byId.set(id, created);
    return created;
  }

  async getBookingDetails(bookingId: string) {
    const booking = this.byId.get(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    return {
      movieTitle: 'Test Movie',
      showtime: '14:00',
      seatId: booking.seatId,
      bookingId: booking.id,
    };
  }

  clear(): void {
    this.store.clear();
    this.byId.clear();
  }
}
