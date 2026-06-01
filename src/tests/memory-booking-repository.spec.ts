import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { MemoryBookingRepository } from '../booking/repositories/memory-booking-repository.js';

describe('MemoryBookingRepository', () => {
  let repo: MemoryBookingRepository;

  beforeEach(() => {
    repo = new MemoryBookingRepository();
  });

  describe('create', () => {
    it('creates a booking and returns it', async () => {
      const booking = {
        id: randomUUID(),
        roomId: randomUUID(),
        showtimeId: randomUUID(),
        seatId: 'A1',
        userId: randomUUID(),
        status: 'CONFIRMED',
      };

      const result = await repo.create(booking);

      expect(result.id).toBe(booking.id);
      expect(result.seatId).toBe('A1');
    });

    it('overwrites if same showtime+seat exists', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();

      const first = await repo.create({
        id: randomUUID(),
        roomId,
        showtimeId,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      const second = await repo.create({
        id: randomUUID(),
        roomId,
        showtimeId,
        seatId: 'A1',
        userId: 'user-2',
        status: 'CONFIRMED',
      });

      expect(second.userId).toBe('user-2');
    });
  });

  describe('findBySeat', () => {
    it('returns booking when exists', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();
      await repo.create({
        id: randomUUID(),
        roomId,
        showtimeId,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      const result = await repo.findBySeat(roomId, 'A1');

      expect(result).not.toBeNull();
      expect(result!.seatId).toBe('A1');
    });

    it('returns null when not found', async () => {
      const result = await repo.findBySeat(randomUUID(), 'A1');
      expect(result).toBeNull();
    });

    it('returns null for wrong room', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();
      await repo.create({
        id: randomUUID(),
        roomId,
        showtimeId,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      const result = await repo.findBySeat(randomUUID(), 'A1');
      expect(result).toBeNull();
    });
  });

  describe('findByRoomId', () => {
    it('returns all bookings for a room', async () => {
      const roomId = randomUUID();
      const showtimeId1 = randomUUID();
      const showtimeId2 = randomUUID();

      await repo.create({
        id: randomUUID(),
        roomId,
        showtimeId: showtimeId1,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      await repo.create({
        id: randomUUID(),
        roomId,
        showtimeId: showtimeId2,
        seatId: 'A2',
        userId: 'user-2',
        status: 'CONFIRMED',
      });

      await repo.create({
        id: randomUUID(),
        roomId: randomUUID(),
        showtimeId: showtimeId1,
        seatId: 'A1',
        userId: 'user-3',
        status: 'CONFIRMED',
      });

      const results = await repo.findByRoomId(roomId);

      expect(results).toHaveLength(2);
      expect(results.map(r => r.seatId).sort()).toEqual(['A1', 'A2']);
    });

    it('returns empty array when no bookings', async () => {
      const results = await repo.findByRoomId(randomUUID());
      expect(results).toHaveLength(0);
    });
  });

  describe('book', () => {
    it('creates booking and returns it when seat is free', async () => {
      const booking = {
        id: randomUUID(),
        roomId: randomUUID(),
        showtimeId: randomUUID(),
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      };

      const result = await repo.book(booking);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(booking.id);
    });

    it('returns null when seat is already booked for same showtime', async () => {
      const roomId = randomUUID();
      const showtimeId = randomUUID();

      await repo.book({
        id: randomUUID(),
        roomId,
        showtimeId,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      const result = await repo.book({
        id: randomUUID(),
        roomId,
        showtimeId,
        seatId: 'A1',
        userId: 'user-2',
        status: 'CONFIRMED',
      });

      expect(result).toBeNull();
    });

    it('succeeds when same seat but different showtime', async () => {
      const roomId = randomUUID();
      const showtimeId1 = randomUUID();
      const showtimeId2 = randomUUID();

      await repo.book({
        id: randomUUID(),
        roomId,
        showtimeId: showtimeId1,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      const result = await repo.book({
        id: randomUUID(),
        roomId,
        showtimeId: showtimeId2,
        seatId: 'A1',
        userId: 'user-2',
        status: 'CONFIRMED',
      });

      expect(result).not.toBeNull();
    });
  });

  describe('clear', () => {
    it('removes all bookings', async () => {
      const roomId = randomUUID();

      await repo.create({
        id: randomUUID(),
        roomId,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      repo.clear();

      const results = await repo.findByRoomId(roomId);
      expect(results).toHaveLength(0);
    });
  });
});
