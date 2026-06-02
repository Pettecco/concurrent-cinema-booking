import type { IMovieRepository } from '../domain/movie-repository.js';
import type { Movie } from '../domain/movie.js';

export class MemoryMovieRepository implements IMovieRepository {
  private movies = new Map<string, Movie>();

  async findById(id: string): Promise<Movie | null> {
    return this.movies.get(id) || null;
  }

  async findAll(): Promise<Movie[]> {
    return Array.from(this.movies.values());
  }

  async create(movie: Movie): Promise<Movie> {
    this.movies.set(movie.id, movie);
    return movie;
  }
}
