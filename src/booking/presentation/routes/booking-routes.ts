import { Router } from 'express';
import type { BookingController } from '../controllers/booking-controller.js';

export function bookingRoutes(controller: BookingController): Router {
  const router = Router();

  router.post('/', (req, res) => controller.create(req, res));
  router.get('/:movieId', (req, res) => controller.listByMovie(req, res));

  return router;
}
