import type { IRoomRepository } from '../domain/room-repository.js';
import type { Room } from '../domain/room.js';

export class MemoryRoomRepository implements IRoomRepository {
  private rooms = new Map<string, Room>();

  async findById(id: string): Promise<Room | null> {
    return this.rooms.get(id) || null;
  }

  async findAll(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async findByMovie(movieId: string): Promise<Room | null> {
    return (
      Array.from(this.rooms.values()).find(room => room.movieId === movieId) ||
      null
    );
  }
}
