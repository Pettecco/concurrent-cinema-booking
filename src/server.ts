import express from 'express';
import cors from 'cors';
import { BookingService } from './booking/application/booking-service.js';
import { BookingController } from './booking/presentation/booking-controller.js';
import { bookingRoutes } from './booking/presentation/booking-routes.js';
import { PostgresBookingRepository } from './booking/repositories/postgres-booking-repository.js';
import { db } from './infra/postgres/client.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

const bookingRepository = new PostgresBookingRepository(db);
const bookingService = new BookingService(bookingRepository);
const controller = new BookingController(bookingService);

app.use(cors());
app.use(express.json());
app.use('/bookings', bookingRoutes(controller));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
