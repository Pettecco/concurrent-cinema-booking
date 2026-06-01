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

  /**
   * @openapi
   * /bookings:
   *   post:
   *     summary: Create a new booking
   *     description: Creates a booking for a specific seat in a showtime. Requires an active lock on the seat.
   *     tags: [Bookings]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - roomId
   *               - showtimeId
   *               - seatId
   *               - userId
   *               - email
   *             properties:
   *               roomId:
   *                 type: string
   *                 format: uuid
   *                 example: '660e8400-e29b-41d4-a716-446655440001'
   *               showtimeId:
   *                 type: string
   *                 format: uuid
   *                 example: '8fa5eeb0-3bc4-4182-9cb9-7ba8f55ae873'
   *               seatId:
   *                 type: string
   *                 example: 'A1'
   *               userId:
   *                 type: string
   *                 format: uuid
   *                 example: '550e8400-e29b-41d4-a716-446655440100'
   *               email:
   *                 type: string
   *                 format: email
   *                 example: 'user@cinema.com'
   *     responses:
   *       201:
   *         description: Booking created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Booking'
   *       400:
   *         description: Invalid input
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Seat not locked by user
   *       409:
   *         description: Seat already booked
   */
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

  /**
   * @openapi
   * /bookings/{roomId}:
   *   get:
   *     summary: List bookings by room
   *     description: Returns all bookings for a specific room
   *     tags: [Bookings]
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Room ID
   *     responses:
   *       200:
   *         description: List of bookings
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Booking'
   *       400:
   *         description: Invalid room ID
   */
  async listByRoom(req: Request, res: Response) {
    const input = listBookingSchema.safeParse({ roomId: req.params.roomId });

    if (!input.success) {
      return res.status(400).json({ errors: input.error.issues });
    }

    const bookings = await this.service.listBookings(input.data.roomId);

    return res.status(200).json(bookings);
  }
}
