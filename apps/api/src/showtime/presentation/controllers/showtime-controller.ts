import type { Request, Response } from 'express';
import type { IShowtimeRepository } from '../../domain/showtime-repository.js';
import { showtimeParamsSchema } from '../schemas/showtime.schema.js';

export class ShowtimeController {
  constructor(private readonly showtimeRepository: IShowtimeRepository) {}

  async findByRoom(req: Request, res: Response) {
    const params = showtimeParamsSchema
      .pick({ roomId: true })
      .safeParse(req.params);

    if (!params.success) {
      return res.status(400).json({ errors: params.error.issues });
    }

    const showtimes = await this.showtimeRepository.findByRoom(
      params.data.roomId
    );
    return res.status(200).json(showtimes);
  }

  async findById(req: Request, res: Response) {
    const params = showtimeParamsSchema
      .pick({ id: true })
      .safeParse(req.params);

    if (!params.success) {
      return res.status(400).json({ errors: params.error.issues });
    }

    const showtime = await this.showtimeRepository.findById(params.data.id);

    if (!showtime) {
      return res.status(404).json({ error: 'Showtime not found' });
    }

    return res.status(200).json(showtime);
  }
}
