import type { Knex } from 'knex';
import type { IBookingRepository } from '../domain/booking-repository.js';
import type { Booking } from '../domain/booking.js';

export class PostgresBookingRepository implements IBookingRepository {
  constructor(private readonly db: Knex) {}

  async create(booking: Booking): Promise<Booking> {
    const [inserted] = await this.db('bookings')
      .insert({
        room_id: booking.roomId,
        showtime_id: booking.showtimeId,
        seat_id: booking.seatId,
        user_id: booking.userId,
        email: booking.email,
        status: booking.status,
      })
      .returning('*');

    return {
      id: inserted.id,
      roomId: inserted.room_id,
      showtimeId: inserted.showtime_id,
      seatId: inserted.seat_id,
      userId: inserted.user_id,
      email: inserted.email,
      status: inserted.status,
    };
  }

  async findByRoomId(roomId: string): Promise<Booking[]> {
    const rows = await this.db('bookings')
      .where({ room_id: roomId })
      .select(
        'id',
        'room_id',
        'showtime_id',
        'seat_id',
        'user_id',
        'email',
        'status'
      );

    return rows.map((row) => ({
      id: row.id,
      roomId: row.room_id,
      showtimeId: row.showtime_id,
      seatId: row.seat_id,
      userId: row.user_id,
      email: row.email,
      status: row.status,
    }));
  }

  async findBySeat(roomId: string, seatId: string): Promise<Booking | null> {
    const booking = await this.db('bookings')
      .where({ room_id: roomId, seat_id: seatId })
      .select(
        'id',
        'room_id',
        'showtime_id',
        'seat_id',
        'user_id',
        'email',
        'status'
      )
      .first();

    if (!booking) {
      return null;
    }

    return {
      id: booking.id,
      roomId: booking.room_id,
      showtimeId: booking.showtime_id,
      seatId: booking.seat_id,
      userId: booking.user_id,
      email: booking.email,
      status: booking.status,
    };
  }

  async book(booking: Omit<Booking, 'id'>): Promise<Booking | null> {
    return this.db.transaction(async (trx) => {
      const existing = await trx('bookings')
        .where({ showtime_id: booking.showtimeId, seat_id: booking.seatId })
        .select('id')
        .forUpdate()
        .first();

      if (existing) {
        return null;
      }

      const [inserted] = await trx('bookings')
        .insert({
          room_id: booking.roomId,
          showtime_id: booking.showtimeId,
          seat_id: booking.seatId,
          user_id: booking.userId,
          email: booking.email,
          status: booking.status,
        })
        .returning('*');

      return {
        id: inserted.id,
        roomId: inserted.room_id,
        showtimeId: inserted.showtime_id,
        seatId: inserted.seat_id,
        userId: inserted.user_id,
        email: inserted.email,
        status: inserted.status,
      };
    });
  }

  async getBookingDetails(bookingId: string) {
    const result = await this.db
      .select<{
        movie_title: string;
        start_time: string;
        seat_id: string;
      }>('m.title as movie_title', 's.start_time as start_time', 'b.seat_id')
      .from('bookings as b')
      .join('showtimes as s', 'b.showtime_id', 's.id')
      .join('rooms as r', 's.room_id', 'r.id')
      .join('movies as m', 'r.movie_id', 'm.id')
      .where('b.id', bookingId)
      .first();

    if (!result) {
      throw new Error('Booking not found');
    }

    return {
      movieTitle: result.movie_title,
      showtime: result.start_time,
      seatId: result.seat_id,
      bookingId,
    };
  }
}
