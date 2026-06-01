import type { Showtime } from '../domain/showtime.js';

export interface IShowtimeRepository {
  /**
   * Retrieves all showtimes for a specific room.
   * @param roomId - The room ID to search by
   * @returns Array of showtimes for the room
   */
  findByRoom(roomId: string): Promise<Showtime[]>;

  /**
   * Finds a showtime by its ID.
   * @param id - The showtime ID
   * @returns The showtime if found, null otherwise
   */
  findById(id: string): Promise<Showtime | null>;
}
