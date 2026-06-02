import { describe, it, expect, vi, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { MovieController } from '../movie/presentation/controllers/movie-controller.js';

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

function makeMovieRepository() {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as import('../movie/domain/movie-repository.js').IMovieRepository;
}

describe('MovieController', () => {
  let ctrl: MovieController;
  let repo: ReturnType<typeof makeMovieRepository>;

  beforeEach(() => {
    repo = makeMovieRepository();
    ctrl = new MovieController(repo);
  });

  describe('findAll', () => {
    it('returns 200 with movies array', async () => {
      const movies = [
        { id: randomUUID(), title: 'Movie 1', duration: 120, releaseDate: new Date() },
        { id: randomUUID(), title: 'Movie 2', duration: 90, releaseDate: new Date() },
      ];
      vi.mocked(repo.findAll).mockResolvedValue(movies);

      const res = makeRes();
      await ctrl.findAll(makeReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(movies);
    });

    it('returns empty array when no movies exist', async () => {
      vi.mocked(repo.findAll).mockResolvedValue([]);

      const res = makeRes();
      await ctrl.findAll(makeReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('findById', () => {
    it('returns 200 with movie when found', async () => {
      const movie = {
        id: randomUUID(),
        title: 'Test Movie',
        duration: 120,
        releaseDate: new Date(),
      };
      vi.mocked(repo.findById).mockResolvedValue(movie);

      const res = makeRes();
      await ctrl.findById(makeReq({ id: movie.id }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(movie);
    });

    it('returns 404 when movie not found', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      const res = makeRes();
      await ctrl.findById(makeReq({ id: randomUUID() }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Movie not found' });
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
});
