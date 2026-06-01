import type { Request, Response } from 'express';
import type { IRoomRepository } from '../../domain/room-repository.js';
import {
  roomParamsSchema,
  movieIdParamsSchema,
} from '../schemas/room.schema.js';

export class RoomController {
  constructor(private readonly roomRepository: IRoomRepository) {}

  async findAll(_req: Request, res: Response) {
    const rooms = await this.roomRepository.findAll();
    return res.status(200).json(rooms);
  }

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
