import type { Room } from '../domain/room.js';

export interface IRoomRepository {
  findById(id: string): Promise<Room | null>;
  findAll(): Promise<Room[]>;
  findByMovie(movieId: string): Promise<Room | null>;
}
