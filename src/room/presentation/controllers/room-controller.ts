import type { Request, Response } from 'express';
import type { IRoomRepository } from '../../domain/room-repository.js';
import {
  roomParamsSchema,
  movieIdParamsSchema,
} from '../schemas/room.schema.js';

export class RoomController {
  constructor(private readonly roomRepository: IRoomRepository) {}

  /**
   * @openapi
   * /rooms:
   *   get:
   *     summary: List all rooms
   *     description: Returns all cinema rooms
   *     tags: [Rooms]
   *     responses:
   *       200:
   *         description: List of all rooms
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Room'
   */
  async findAll(_req: Request, res: Response) {
    const rooms = await this.roomRepository.findAll();
    return res.status(200).json(rooms);
  }

  /**
   * @openapi
   * /rooms/{id}:
   *   get:
   *     summary: Get room by ID
   *     description: Returns a specific room by ID
   *     tags: [Rooms]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Room ID
   *     responses:
   *       200:
   *         description: Room details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Room'
   *       400:
   *         description: Invalid room ID
   *       404:
   *         description: Room not found
   */
  async findById(req: Request, res: Response) {
    const params = roomParamsSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ errors: params.error.issues });
    }

    const room = await this.roomRepository.findById(params.data.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    return res.status(200).json(room);
  }

  /**
   * @openapi
   * /rooms/movie/{movieId}:
   *   get:
   *     summary: Get room by movie ID
   *     description: Returns the room associated with a specific movie
   *     tags: [Rooms]
   *     parameters:
   *       - in: path
   *         name: movieId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Movie ID
   *     responses:
   *       200:
   *         description: Room details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Room'
   *       400:
   *         description: Invalid movie ID
   *       404:
   *         description: Room not found for this movie
   */
  async findByMovie(req: Request, res: Response) {
    const params = movieIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return res.status(400).json({ errors: params.error.issues });
    }

    const room = await this.roomRepository.findByMovie(params.data.movieId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found for this movie' });
    }
    return res.status(200).json(room);
  }
}
