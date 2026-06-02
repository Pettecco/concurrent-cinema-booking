import type { Knex } from 'knex';
import type { IMovieRepository } from '../domain/movie-repository.js';
import type { Movie } from '../domain/movie.js';

export class PostgresMovieRepository implements IMovieRepository {
  constructor(private readonly db: Knex) {}

  async findById(id: string): Promise<Movie | null> {
    const movie = await this.db('movies').where({ id }).first();
    if (!movie) return null;

    return this.toDomain(movie);
  }

  async findAll(): Promise<Movie[]> {
    const movies = await this.db('movies').orderBy('title');
    return movies.map(movie => this.toDomain(movie));
  }

  async create(movie: Movie): Promise<Movie> {
    await this.db('movies').insert(this.toPersistence(movie));
    return movie;
  }

  private toDomain(row: any): Movie {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      duration: row.duration,
      releaseDate: new Date(row.release_date),
      genre: row.genre,
      rating: row.rating,
      bannerUrl: row.banner_url,
    };
  }

  private toPersistence(movie: Movie) {
    return {
      id: movie.id,
      title: movie.title,
      description: movie.description,
      duration: movie.duration,
      release_date: movie.releaseDate,
      genre: movie.genre,
      rating: movie.rating,
      banner_url: movie.bannerUrl,
    };
  }
}
