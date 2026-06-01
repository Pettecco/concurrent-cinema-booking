import type { Room } from '../domain/room.js';

export interface IRoomRepository {
  /**
   * Finds a room by its ID.
   * @param id - The room ID
   * @returns The room if found, null otherwise
   */
  findById(id: string): Promise<Room | null>;

  /**
   * Retrieves all rooms.
   * @returns Array of all rooms
   */
  findAll(): Promise<Room[]>;

  /**
   * Finds the room associated with a specific movie.
   * @param movieId - The movie ID
   * @returns The room if found, null otherwise
   */
  findByMovie(movieId: string): Promise<Room | null>;
}
