import type { Knex } from 'knex';
import type { IShowtimeRepository } from '../domain/showtime-repository.js';
import type { Showtime } from '../domain/showtime.js';

export class PostgresShowtimeRepository implements IShowtimeRepository {
  constructor(private readonly db: Knex) {}

  async findByRoom(roomId: string): Promise<Showtime[]> {
    const showtimes = await this.db('showtimes')
      .where({ room_id: roomId })
      .orderBy('start_time');

    return showtimes.map(row => this.toDomain(row));
  }

  async findById(id: string): Promise<Showtime | null> {
    const showtime = await this.db('showtimes').where({ id }).first();
    if (!showtime) return null;
    return this.toDomain(showtime);
  }

  private toDomain(row: any): Showtime {
    return {
      id: row.id,
      roomId: row.room_id,
      startTime: row.start_time,
      endTime: row.end_time,
    };
  }
}
