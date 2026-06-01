import type { Request, Response } from 'express';
import type { IMovieRepository } from '../../domain/movie-repository.js';
import { movieParamsSchema } from '../schemas/movie.schema.js';

export class MovieController {
  constructor(private readonly movieRepository: IMovieRepository) {}

  async findAll(_req: Request, res: Response) {
    const movies = await this.movieRepository.findAll();
    return res.status(200).json(movies);
  }

  async findById(req: Request, res: Response) {
    const params = movieParamsSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ errors: params.error.issues });
    }

    const movie = await this.movieRepository.findById(params.data.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    return res.status(200).json(movie);
  }
}
