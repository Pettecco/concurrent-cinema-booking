import { Router } from 'express';
import type { LockController } from '../controllers/lock-controller.js';

export function lockRoutes(controller: LockController): Router {
  const router = Router();

  router.post('/', (req, res) => controller.acquire(req, res));
  router.delete('/', (req, res) => controller.release(req, res));

  return router;
}
