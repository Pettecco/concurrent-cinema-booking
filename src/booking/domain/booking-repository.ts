import type { Booking } from './booking.js';

export interface IBookingRepository {
  book(booking: Booking): Promise<Booking | null>;
  findByRoomId(roomId: string): Promise<Booking[]>;
  findBySeat(roomId: string, seatId: string): Promise<Booking | null>;
}
