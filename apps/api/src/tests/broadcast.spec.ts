import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBroadcast } from '../infra/websocket/broadcast.js';

function makeMockIO() {
  const emit = vi.fn();
  const to = vi.fn().mockReturnValue({ emit });
  return { to, emit };
}

describe('createBroadcast', () => {
  let mockIO: ReturnType<typeof makeMockIO>;
  let broadcast: ReturnType<typeof createBroadcast>;

  beforeEach(() => {
    mockIO = makeMockIO();
    broadcast = createBroadcast(
      mockIO as unknown as import('socket.io').Server
    );
  });

  it('emitSeatLocked calls io.to(roomId).emit with correct payload', () => {
    const roomId = 'movie-1';
    const seatId = 'A1';
    const userId = 'user-1';
    const expiresAt = new Date('2026-01-01T00:00:00Z');

    broadcast.emitSeatLocked(roomId, seatId, userId, expiresAt);

    expect(mockIO.to).toHaveBeenCalledWith(roomId);
    expect(mockIO.emit).toHaveBeenCalledWith('seat_locked', {
      type: 'seat_locked',
      roomId,
      seatId,
      userId,
      expiresAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('emitSeatReleased calls io.to(roomId).emit with correct payload', () => {
    const roomId = 'movie-1';
    const seatId = 'A1';

    broadcast.emitSeatReleased(roomId, seatId);

    expect(mockIO.to).toHaveBeenCalledWith(roomId);
    expect(mockIO.emit).toHaveBeenCalledWith('seat_released', {
      type: 'seat_released',
      roomId,
      seatId,
    });
  });

  it('emitSeatBooked calls io.to(roomId).emit with correct payload', () => {
    const roomId = 'movie-1';
    const seatId = 'A1';
    const userId = 'user-1';

    broadcast.emitSeatBooked(roomId, seatId, userId);

    expect(mockIO.to).toHaveBeenCalledWith(roomId);
    expect(mockIO.emit).toHaveBeenCalledWith('seat_booked', {
      type: 'seat_booked',
      roomId,
      seatId,
      userId,
    });
  });

  it('emitLockExpired calls io.to(roomId).emit with correct payload', () => {
    const roomId = 'movie-1';
    const seatId = 'A1';

    broadcast.emitLockExpired(roomId, seatId);

    expect(mockIO.to).toHaveBeenCalledWith(roomId);
    expect(mockIO.emit).toHaveBeenCalledWith('lock_expired', {
      type: 'lock_expired',
      roomId,
      seatId,
    });
  });
});
