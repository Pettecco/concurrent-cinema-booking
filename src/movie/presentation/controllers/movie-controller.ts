import type { Request, Response } from 'express';
import type { IMovieRepository } from '../../domain/movie-repository.js';
import { movieParamsSchema } from '../schemas/movie.schema.js';

export class MovieController {
  constructor(private readonly movieRepository: IMovieRepository) {}

  /**
   * @openapi
   * /movies:
   *   get:
   *     summary: List all movies
   *     description: Returns all movies available in the cinema
   *     tags: [Movies]
   *     responses:
   *       200:
   *         description: List of all movies
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Movie'
   */
  async findAll(_req: Request, res: Response) {
    const movies = await this.movieRepository.findAll();
    return res.status(200).json(movies);
  }

  /**
   * @openapi
   * /movies/{id}:
   *   get:
   *     summary: Get movie by ID
   *     description: Returns a specific movie by ID
   *     tags: [Movies]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Movie ID
   *     responses:
   *       200:
   *         description: Movie details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Movie'
   *       400:
   *         description: Invalid movie ID
   *       404:
   *         description: Movie not found
   */
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
