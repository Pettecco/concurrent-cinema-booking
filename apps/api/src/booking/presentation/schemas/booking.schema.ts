import { z } from 'zod';

export const createBookingSchema = z.object({
  roomId: z.uuid().min(1),
  showtimeId: z.uuid().min(1),
  seatId: z.string().min(1),
  userId: z.string().min(1),
  email: z.email().min(1),
});

export const createBatchBookingSchema = z.object({
  roomId: z.uuid().min(1),
  showtimeId: z.uuid().min(1),
  seatIds: z.array(z.string().min(1)).min(1),
  userId: z.string().min(1),
  email: z.email().min(1),
});

export const listBookingSchema = z.object({
  roomId: z.uuid().min(1),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateBatchBookingInput = z.infer<typeof createBatchBookingSchema>;
