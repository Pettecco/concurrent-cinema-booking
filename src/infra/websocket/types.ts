import { z } from 'zod';

export const clientToServerSchema = z.object({
  type: z.enum(['subscribe', 'unsubscribe']),
  roomId: z.uuid(),
});

export const serverToClientSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('seat_locked'),
    roomId: z.uuid(),
    seatId: z.string(),
    userId: z.uuid(),
    expiresAt: z.iso.datetime(),
  }),
  z.object({
    type: z.literal('seat_released'),
    roomId: z.uuid(),
    seatId: z.string(),
  }),
  z.object({
    type: z.literal('seat_booked'),
    roomId: z.uuid(),
    seatId: z.string(),
    userId: z.uuid(),
  }),
  z.object({
    type: z.literal('lock_expired'),
    roomId: z.uuid(),
    seatId: z.string(),
  }),
  z.object({
    type: z.literal('error'),
    message: z.string(),
  }),
]);

export type ServerToClientEvent = z.infer<typeof serverToClientSchema>;
