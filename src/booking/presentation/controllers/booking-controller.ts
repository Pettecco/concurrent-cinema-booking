import type { Request, Response } from 'express';
import type { BookingService } from '../../application/booking-service.js';
import {
  createBookingSchema,
  listBookingSchema,
} from '../schemas/booking.schema.js';
import type { Broadcast } from '../../../infra/websocket/broadcast.js';
import { EmailService } from '../../../application/services/email-service.js';

export class BookingController {
  constructor(
    private readonly service: BookingService,
    private readonly broadcast: Broadcast,
    private readonly emailService: EmailService
  ) {}

  async create(req: Request, res: Response) {
    const input = createBookingSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ errors: input.error.issues });
    }

    const { roomId, showtimeId, seatId, userId, email } = input.data;

    const booking = await this.service.book({
      roomId,
      showtimeId,
      seatId,
      userId,
      email,
      status: 'CONFIRMED',
    });

    this.broadcast.emitSeatBooked(roomId, seatId, userId);

    const bookingDetails = await this.service.getBookingDetails(booking.id);

    await this.emailService.sendBookingConfirmation(
      booking.email,
      bookingDetails
    );

    return res.status(201).json(booking);
  }

  async listByRoom(req: Request, res: Response) {
    const input = listBookingSchema.safeParse({ roomId: req.params.roomId });

    if (!input.success) {
      return res.status(400).json({ errors: input.error.issues });
    }

    const bookings = await this.service.listBookings(input.data.roomId);

    return res.status(200).json(bookings);
  }
}
