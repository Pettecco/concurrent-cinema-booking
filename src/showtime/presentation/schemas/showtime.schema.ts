import { z } from 'zod';

export const createShowtimeSchema = z.object({
  roomId: z.string().uuid(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
});

export const showtimeSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});
