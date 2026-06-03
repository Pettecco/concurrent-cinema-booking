import { Router } from 'express';
import type { ShowtimeController } from '../controllers/showtime-controller.js';

export function showtimeRoutes(controller: ShowtimeController): Router {
  const router = Router();

  router.get('/room/:roomId', (req, res) => controller.findByRoom(req, res));
  router.get('/:id', (req, res) => controller.findById(req, res));

  return router;
}
