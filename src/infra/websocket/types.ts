import { z } from 'zod';

export const clientToServerSchema = z.object({
  type: z.enum(['subscribe', 'unsubscribe']),
  movieId: z.uuid(),
});

export type ClientToServerEvent = z.infer<typeof clientToServerSchema>;

export const serverToClientSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('seat_locked'),
    movieId: z.uuid(),
    seatId: z.string(),
    userId: z.uuid(),
    expiresAt: z.iso.datetime(),
  }),
  z.object({
    type: z.literal('seat_released'),
    movieId: z.uuid(),
    seatId: z.string(),
  }),
  z.object({
    type: z.literal('seat_booked'),
    movieId: z.uuid(),
    seatId: z.string(),
    userId: z.uuid(),
  }),
  z.object({
    type: z.literal('lock_expired'),
    movieId: z.uuid(),
    seatId: z.string(),
  }),
  z.object({
    type: z.literal('error'),
    message: z.string(),
  }),
]);

export type ServerToClientEvent = z.infer<typeof serverToClientSchema>;

export type ServerEventType = ServerToClientEvent['type'];
