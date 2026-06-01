import { z } from 'zod';

export const movieSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().int().positive(),
  releaseDate: z.date(),
  genre: z.string().optional(),
  rating: z.string().optional(),
  bannerUrl: z.url().optional(),
});

export const movieParamsSchema = z.object({
  id: z.uuid('Invalid movie ID'),
});

export type MovieInput = z.infer<typeof movieSchema>;
