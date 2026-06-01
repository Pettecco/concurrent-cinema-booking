import type { Showtime } from '../domain/showtime.js';

export interface IShowtimeRepository {
  findByRoom(roomId: string): Promise<Showtime[]>;
  findById(id: string): Promise<Showtime | null>;
  create(data: Omit<Showtime, 'id'>): Promise<Showtime>;
  delete(id: string): Promise<void>;
}
