import { describe, it, expect, vi, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { RoomController } from '../room/presentation/controllers/room-controller.js';

function makeReq(params?: Record<string, string>) {
  return {
    params: params ?? {},
  } as unknown as import('express').Request;
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as import('express').Response & typeof res;
}

function makeRoomRepository() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByMovie: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as import('../room/domain/room-repository.js').IRoomRepository;
}

describe('RoomController', () => {
  let ctrl: RoomController;
  let repo: ReturnType<typeof makeRoomRepository>;

  beforeEach(() => {
    repo = makeRoomRepository();
    ctrl = new RoomController(repo);
  });

  describe('findAll', () => {
    it('returns 200 with rooms array', async () => {
      const rooms = [
        {
          id: randomUUID(),
          name: 'Room 1',
          movieId: randomUUID(),
          totalSeats: 50,
        },
        {
          id: randomUUID(),
          name: 'Room 2',
          movieId: randomUUID(),
          totalSeats: 30,
        },
      ];
      vi.mocked(repo.findAll).mockResolvedValue(rooms);

      const res = makeRes();
      await ctrl.findAll(makeReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(rooms);
    });

    it('returns empty array when no rooms exist', async () => {
      vi.mocked(repo.findAll).mockResolvedValue([]);

      const res = makeRes();
      await ctrl.findAll(makeReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('findById', () => {
    it('returns 200 with room when found', async () => {
      const room = {
        id: randomUUID(),
        name: 'Test Room',
        movieId: randomUUID(),
        totalSeats: 50,
      };
      vi.mocked(repo.findById).mockResolvedValue(room);

      const res = makeRes();
      await ctrl.findById(makeReq({ id: room.id }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(room);
    });

    it('returns 404 when room not found', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      const res = makeRes();
      await ctrl.findById(makeReq({ id: randomUUID() }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Room not found' });
    });

    it('returns 400 when id is invalid', async () => {
      const res = makeRes();
      await ctrl.findById(makeReq({ id: 'not-a-uuid' }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ errors: expect.any(Array) })
      );
    });
  });

  describe('findByMovie', () => {
    it('returns 200 with room when found', async () => {
      const movieId = randomUUID();
      const room = {
        id: randomUUID(),
        name: 'Test Room',
        movieId,
        totalSeats: 50,
      };
      vi.mocked(repo.findByMovie).mockResolvedValue(room);

      const res = makeRes();
      await ctrl.findByMovie(makeReq({ movieId }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(room);
    });

    it('returns 404 when room not found for movie', async () => {
      vi.mocked(repo.findByMovie).mockResolvedValue(null);

      const res = makeRes();
      await ctrl.findByMovie(makeReq({ movieId: randomUUID() }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Room not found for this movie',
      });
    });

    it('returns 400 when movieId is invalid', async () => {
      const res = makeRes();
      await ctrl.findByMovie(makeReq({ movieId: 'not-a-uuid' }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ errors: expect.any(Array) })
      );
    });
  });
});
