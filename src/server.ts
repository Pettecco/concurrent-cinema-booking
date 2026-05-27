import express from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import { BookingService } from './booking/application/booking-service.js';
import { BookingController } from './booking/presentation/booking-controller.js';
import { bookingRoutes } from './booking/presentation/booking-routes.js';
import { PostgresBookingRepository } from './booking/repositories/postgres-booking-repository.js';
import { db } from './infra/postgres/client.js';
import { logger } from './infra/http/logger.js';
import { errorHandler } from './infra/http/error-handler.js';
import { env } from './infra/env.js';

const app = express();

const bookingRepository = new PostgresBookingRepository(db);
const bookingService = new BookingService(bookingRepository);
const controller = new BookingController(bookingService);

app.use(cors());
app.use(pinoHttp({ logger }));
app.use(express.json());
app.use('/bookings', bookingRoutes(controller));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`Server running on port: ${env.PORT}`);
});
