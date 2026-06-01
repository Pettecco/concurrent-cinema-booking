import type { Movie } from '../domain/movie.js';

export interface IMovieRepository {
  /**
   * Finds a movie by its ID.
   * @param id - The movie ID
   * @returns The movie if found, null otherwise
   */
  findById(id: string): Promise<Movie | null>;

  /**
   * Retrieves all movies.
   * @returns Array of all movies
   */
  findAll(): Promise<Movie[]>;

  /**
   * Creates a new movie.
   * @param movie - The movie to create
   * @returns The created movie
   */
  create(movie: Movie): Promise<Movie>;
}
