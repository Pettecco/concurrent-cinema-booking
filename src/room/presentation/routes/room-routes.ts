import type { Router } from 'express';
import type { RoomController } from '../controllers/room-controller.js';

export function roomRoutes(router: Router, controller: RoomController) {
  router.get('/rooms', (req, res) => controller.findAll(req, res));
  router.get('/rooms/:id', (req, res) => controller.findById(req, res));
  router.get('/movies/:movieId/room', (req, res) =>
    controller.findByMovie(req, res)
  );
}
