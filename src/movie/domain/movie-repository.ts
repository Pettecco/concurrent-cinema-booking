import type { Movie } from '../domain/movie.js';

export interface IMovieRepository {
  findById(id: string): Promise<Movie | null>;
  findAll(): Promise<Movie[]>;
}
