import type { Request, Response } from 'express';
import type { BookingService } from '../../application/booking-service.js';
import {
  createBookingSchema,
  listBookingSchema,
} from '../schemas/booking.schema.js';
import type { Broadcast } from '../../../infra/websocket/broadcast.js';
import { EmailService } from '../../../application/services/email-service.js';
import { AuditService } from '../../../audit/application/audit-service.js';

export class BookingController {
  constructor(
    private readonly service: BookingService,
    private readonly broadcast: Broadcast,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService
  ) {}

  async create(req: Request, res: Response) {
    const input = createBookingSchema.safeParse(req.body);
    if (!input.success) {
      return res.status(400).json({ errors: input.error.issues });
    }

    const { roomId, showtimeId, seatId, userId, email } = input.data;

    try {
      const booking = await this.service.book({
        roomId,
        showtimeId,
        seatId,
        userId,
        email,
        status: 'CONFIRMED',
      });

      this.broadcast.emitSeatBooked(roomId, seatId, userId);

      await this.auditService.emit('booking.created', {
        bookingId: booking.id,
        roomId,
        showtimeId,
        seatId,
        userId,
        email,
      });

      const bookingDetails = await this.service.getBookingDetails(booking.id);

      await this.emailService.sendBookingConfirmation(
        booking.email,
        bookingDetails
      );

      return res.status(201).json(booking);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown';
      await this.auditService.emit('booking.failed', {
        roomId,
        showtimeId,
        seatId,
        userId,
        reason,
      });
      throw error;
    }
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
