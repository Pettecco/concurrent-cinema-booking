import { z } from 'zod';

export const showtimeParamsSchema = z.object({
  id: z.uuid('Invalid showtime ID'),
  roomId: z.uuid('Invalid room ID'),
});

export type ShowtimeParams = z.infer<typeof showtimeParamsSchema>;
