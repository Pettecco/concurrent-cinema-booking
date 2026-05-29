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
        movieId: randomUUID(),
        seatId: 'A1',
        userId: randomUUID(),
        status: 'CONFIRMED',
      };

      const result = await repo.create(booking);

      expect(result.id).toBe(booking.id);
      expect(result.seatId).toBe('A1');
    });

    it('overwrites if same movie+seat exists', async () => {
      const movieId = randomUUID();

      const first = await repo.create({
        id: randomUUID(),
        movieId,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      const second = await repo.create({
        id: randomUUID(),
        movieId,
        seatId: 'A1',
        userId: 'user-2',
        status: 'CONFIRMED',
      });

      expect(second.userId).toBe('user-2');
    });
  });

  describe('findBySeat', () => {
    it('returns booking when exists', async () => {
      const movieId = randomUUID();
      await repo.create({
        id: randomUUID(),
        movieId,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      const result = await repo.findBySeat(movieId, 'A1');

      expect(result).not.toBeNull();
      expect(result!.seatId).toBe('A1');
    });

    it('returns null when not found', async () => {
      const result = await repo.findBySeat(randomUUID(), 'A1');
      expect(result).toBeNull();
    });

    it('returns null for wrong movie', async () => {
      const movieId = randomUUID();
      await repo.create({
        id: randomUUID(),
        movieId,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      const result = await repo.findBySeat(randomUUID(), 'A1');
      expect(result).toBeNull();
    });
  });

  describe('findByMovieId', () => {
    it('returns all bookings for a movie', async () => {
      const movieId = randomUUID();

      await repo.create({
        id: randomUUID(),
        movieId,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      await repo.create({
        id: randomUUID(),
        movieId,
        seatId: 'A2',
        userId: 'user-2',
        status: 'CONFIRMED',
      });

      await repo.create({
        id: randomUUID(),
        movieId: randomUUID(),
        seatId: 'A1',
        userId: 'user-3',
        status: 'CONFIRMED',
      });

      const results = await repo.findByMovieId(movieId);

      expect(results).toHaveLength(2);
      expect(results.map(r => r.seatId).sort()).toEqual(['A1', 'A2']);
    });

    it('returns empty array when no bookings', async () => {
      const results = await repo.findByMovieId(randomUUID());
      expect(results).toHaveLength(0);
    });
  });

  describe('book', () => {
    it('creates booking and returns it when seat is free', async () => {
      const booking = {
        id: randomUUID(),
        movieId: randomUUID(),
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      };

      const result = await repo.book(booking);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(booking.id);
    });

    it('returns null when seat is already booked', async () => {
      const movieId = randomUUID();

      await repo.book({
        id: randomUUID(),
        movieId,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      const result = await repo.book({
        id: randomUUID(),
        movieId,
        seatId: 'A1',
        userId: 'user-2',
        status: 'CONFIRMED',
      });

      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('removes all bookings', async () => {
      const movieId = randomUUID();

      await repo.create({
        id: randomUUID(),
        movieId,
        seatId: 'A1',
        userId: 'user-1',
        status: 'CONFIRMED',
      });

      repo.clear();

      const results = await repo.findByMovieId(movieId);
      expect(results).toHaveLength(0);
    });
  });
});
