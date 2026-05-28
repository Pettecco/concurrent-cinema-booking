import { z } from 'zod';

export const manipulateLockSchema = z.object({
  movieId: z.uuid().min(1),
  seatId: z.string().min(1),
  userId: z.uuid().min(1),
});

export type ManipulateLockInput = z.infer<typeof manipulateLockSchema>;
