import type { Knex } from 'knex';
import type { IBookingRepository } from '../domain/booking-repository.js';
import type { Booking } from '../domain/booking.js';

export class PostgresBookingRepository implements IBookingRepository {
  constructor(private readonly db: Knex) {}

  async create(booking: Booking): Promise<Booking> {
    const [inserted] = await this.db('bookings')
      .insert({
        movie_id: booking.movieId,
        seat_id: booking.seatId,
        user_id: booking.userId,
        status: booking.status,
      })
      .returning('*');

    return {
      id: inserted.id,
      movieId: inserted.movie_id,
      seatId: inserted.seat_id,
      userId: inserted.user_id,
      status: inserted.status,
    };
  }

  async findByMovieId(movieId: string): Promise<Booking[]> {
    const rows = await this.db('bookings')
      .where({ movie_id: movieId })
      .select('id', 'movie_id', 'seat_id', 'user_id', 'status');

    return rows.map(row => ({
      id: row.id,
      movieId: row.movie_id,
      seatId: row.seat_id,
      userId: row.user_id,
      status: row.status,
    }));
  }

  async findBySeat(movieId: string, seatId: string): Promise<Booking | null> {
    const booking = await this.db('bookings')
      .where({ movie_id: movieId, seat_id: seatId })
      .select('id', 'movie_id', 'seat_id', 'user_id', 'status')
      .first();

    if (!booking) {
      return null;
    }

    return {
      id: booking.id,
      movieId: booking.movie_id,
      seatId: booking.seat_id,
      userId: booking.user_id,
      status: booking.status,
    };
  }

  async book(booking: Booking): Promise<Booking | null> {
    return this.db.transaction(async trx => {
      const existing = await trx('bookings')
        .where({ movie_id: booking.movieId, seat_id: booking.seatId })
        .select('id')
        .forUpdate()
        .first();

      if (existing) {
        return null;
      }

      const [inserted] = await trx('bookings')
        .insert({
          movie_id: booking.movieId,
          seat_id: booking.seatId,
          user_id: booking.userId,
          status: booking.status,
        })
        .returning('*');

      return {
        id: inserted.id,
        movieId: inserted.movie_id,
        seatId: inserted.seat_id,
        userId: inserted.user_id,
        status: inserted.status,
      };
    });
  }
}
