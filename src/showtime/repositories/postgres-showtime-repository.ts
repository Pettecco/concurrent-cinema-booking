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

  async create(data: Omit<Showtime, 'id'>): Promise<Showtime> {
    const [row] = await this.db('showtimes')
      .insert({
        id: this.db.raw('gen_random_uuid()'),
        room_id: data.roomId,
        start_time: data.startTime,
        end_time: data.endTime,
      })
      .returning('*');

    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.db('showtimes').where({ id }).del();
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
