import express from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { BookingService } from './booking/application/booking-service.js';
import { BookingController } from './booking/presentation/controllers/booking-controller.js';
import { bookingRoutes } from './booking/presentation/routes/booking-routes.js';
import { LockController } from './booking/presentation/controllers/lock-controller.js';
import { lockRoutes } from './booking/presentation/routes/lock-routes.js';
import { PostgresBookingRepository } from './booking/repositories/postgres-booking-repository.js';
import { RedisLockService } from './infra/redis/lock-service.js';
import { db } from './infra/postgres/client.js';
import { redis } from './infra/redis/client.js';
import { logger } from './infra/http/logger.js';
import { errorHandler } from './infra/http/error-handler.js';
import { env } from './infra/env.js';

const app = express();

const bookingRepository = new PostgresBookingRepository(db);
const lockService = new RedisLockService(redis);
const bookingService = new BookingService(bookingRepository, lockService);
const bookingController = new BookingController(bookingService);
const lockController = new LockController(lockService);

app.use(cors());
app.use(pinoHttp({ logger, autoLogging: false }));
app.use(express.json());
app.use('/bookings', bookingRoutes(bookingController));
app.use('/locks', lockRoutes(lockController));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Server running on port: ${env.PORT}`);
});
