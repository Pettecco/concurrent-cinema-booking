import type { Router } from 'express';
import type { MovieController } from '../controllers/movie-controller.js';

export function movieRoutes(router: Router, controller: MovieController) {
  router.get('/movies', (req, res) => controller.findAll(req, res));
  router.get('/movies/:id', (req, res) => controller.findById(req, res));
}
