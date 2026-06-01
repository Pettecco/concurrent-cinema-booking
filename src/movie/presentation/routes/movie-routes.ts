import { Router } from 'express';
import type { MovieController } from '../controllers/movie-controller.js';

export function movieRoutes(controller: MovieController): Router {
  const router = Router();

  router.get('/', (req, res) => controller.findAll(req, res));
  router.get('/:id', (req, res) => controller.findById(req, res));

  return router;
}
