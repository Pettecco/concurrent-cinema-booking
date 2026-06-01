import type { Knex } from 'knex';
import type { IRoomRepository } from '../domain/room-repository.js';
import type { Room } from '../domain/room.js';

export class PostgresRoomRepository implements IRoomRepository {
  constructor(private readonly db: Knex) {}

  async findById(id: string): Promise<Room | null> {
    const room = await this.db('rooms').where({ id }).first();
    if (!room) return null;

    return this.toDomain(room);
  }

  async findAll(): Promise<Room[]> {
    const rooms = await this.db('rooms').orderBy('name');
    return rooms.map(room => this.toDomain(room));
  }

  async findByMovie(movieId: string): Promise<Room | null> {
    const room = await this.db('rooms').where({ movie_id: movieId }).first();
    if (!room) return null;
    return this.toDomain(room);
  }

  private toDomain(row: any): Room {
    return {
      id: row.id,
      name: row.name,
      movieId: row.movie_id,
      totalSeats: row.total_seats,
      layout: row.layout,
    };
  }
}
