import type { Server } from 'socket.io';
import type { ServerToClientEvent } from './types.js';

export type Broadcast = ReturnType<typeof createBroadcast>;

export function createBroadcast(io: Server) {
  return {
    emitSeatLocked(
      roomId: string,
      seatId: string,
      userId: string,
      expiresAt: Date
    ) {
      const event: ServerToClientEvent = {
        type: 'seat_locked',
        roomId,
        seatId,
        userId,
        expiresAt: expiresAt.toISOString(),
      };
      io.to(roomId).emit('seat_locked', event);
    },

    emitSeatReleased(roomId: string, seatId: string) {
      const event: ServerToClientEvent = {
        type: 'seat_released',
        roomId,
        seatId,
      };
      io.to(roomId).emit('seat_released', event);
    },

    emitSeatBooked(roomId: string, seatId: string, userId: string) {
      const event: ServerToClientEvent = {
        type: 'seat_booked',
        roomId,
        seatId,
        userId,
      };
      io.to(roomId).emit('seat_booked', event);
    },

    emitLockExpired(roomId: string, seatId: string) {
      const event: ServerToClientEvent = {
        type: 'lock_expired',
        roomId,
        seatId,
      };
      io.to(roomId).emit('lock_expired', event);
    },
  };
}
