import type { Server } from 'socket.io';
import type { ServerToClientEvent } from './types.js';

export type Broadcast = ReturnType<typeof createBroadcast>;

export function createBroadcast(io: Server) {
  return {
    emitSeatLocked(
      movieId: string,
      seatId: string,
      userId: string,
      expiresAt: Date
    ) {
      const event: ServerToClientEvent = {
        type: 'seat_locked',
        movieId,
        seatId,
        userId,
        expiresAt: expiresAt.toISOString(),
      };
      io.to(movieId).emit('seat_locked', event);
    },

    emitSeatReleased(movieId: string, seatId: string) {
      const event: ServerToClientEvent = {
        type: 'seat_released',
        movieId,
        seatId,
      };
      io.to(movieId).emit('seat_released', event);
    },

    emitSeatBooked(movieId: string, seatId: string, userId: string) {
      const event: ServerToClientEvent = {
        type: 'seat_booked',
        movieId,
        seatId,
        userId,
      };
      io.to(movieId).emit('seat_booked', event);
    },

    emitLockExpired(movieId: string, seatId: string) {
      const event: ServerToClientEvent = {
        type: 'lock_expired',
        movieId,
        seatId,
      };
      io.to(movieId).emit('lock_expired', event);
    },
  };
}
