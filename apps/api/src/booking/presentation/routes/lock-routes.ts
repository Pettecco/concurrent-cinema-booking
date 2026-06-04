import { Router } from 'express';
import type { LockController } from '../controllers/lock-controller.js';

export function lockRoutes(controller: LockController): Router {
  const router = Router();

  router.get('/', (req, res) => controller.listActive(req, res));
  router.post('/', (req, res) => controller.acquire(req, res));
  router.delete('/', (req, res) => controller.release(req, res));

  return router;
}
