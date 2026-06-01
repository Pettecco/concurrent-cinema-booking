import { Router } from 'express';
import type { RoomController } from '../controllers/room-controller.js';

export function roomRoutes(controller: RoomController): Router {
  const router = Router();

  router.get('/', (req, res) => controller.findAll(req, res));
  router.get('/:id', (req, res) => controller.findById(req, res));
  router.get('/movie/:movieId', (req, res) => controller.findByMovie(req, res));

  return router;
}
