import express from 'express';
import cors from 'cors';
import { RedisLockMemoryStore } from './booking/infrastructure/redis-store.js';
import { BookingService } from './booking/application/booking-service.js';
import { BookingController } from './booking/presentation/booking-controller.js';
import { bookingRoutes } from './booking/presentation/booking-routes.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

const store = new RedisLockMemoryStore();
const service = new BookingService(store);
const controller = new BookingController(service);

app.use(cors());
app.use(express.json());
app.use('/bookings', bookingRoutes(controller));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
