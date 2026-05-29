import type { Request, Response } from 'express';
import type { BookingService } from '../../application/booking-service.js';
import {
  createBookingSchema,
  listBookingSchema,
} from '../schemas/booking.schema.js';
import type { Broadcast } from '../../../infra/websocket/broadcast.js';

export class BookingController {
  constructor(
    private readonly service: BookingService,
    private readonly broadcast: Broadcast
  ) {}

  async create(req: Request, res: Response) {
    const input = createBookingSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ errors: input.error.issues });
    }

    const { movieId, seatId, userId } = input.data;

    const booking = await this.service.book({
      id: crypto.randomUUID(),
      movieId,
      seatId,
      userId,
      status: 'CONFIRMED',
    });

    this.broadcast.emitSeatBooked(movieId, seatId, userId);

    return res.status(201).json(booking);
  }

  async listByMovie(req: Request, res: Response) {
    const input = listBookingSchema.safeParse({ movieId: req.params.movieId });

    if (!input.success) {
      return res.status(400).json({ errors: input.error.issues });
    }

    const bookings = await this.service.listBookings(input.data.movieId);

    return res.status(200).json(bookings);
  }
}
