import { z } from 'zod';

export const roomSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  movieId: z.uuid(),
  totalSeats: z.number().int().positive(),
  layout: z.string().optional(),
});

export const roomParamsSchema = z.object({
  id: z.uuid('Invalid room ID'),
});

export const movieIdParamsSchema = z.object({
  movieId: z.uuid('Invalid movie ID'),
});

export type RoomInput = z.infer<typeof roomSchema>;
