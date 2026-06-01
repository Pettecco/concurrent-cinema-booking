import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
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
import { HealthController } from './infra/http/health-controller.js';
import { setupWebSocket } from './infra/websocket/server.js';
import { createBroadcast } from './infra/websocket/broadcast.js';
import { startKeyspaceListener } from './infra/websocket/keyspace-listener.js';
import { MovieController } from './movie/presentation/controllers/movie-controller.js';
import { movieRoutes } from './movie/presentation/routes/movie-routes.js';
import { PostgresMovieRepository } from './movie/repositories/postgres-movie-repository.js';
import { RoomController } from './room/presentation/controllers/room-controller.js';
import { roomRoutes } from './room/presentation/routes/room-routes.js';
import { PostgresRoomRepository } from './room/repositories/postgres-room-repository.js';
import { EmailService } from './application/services/email-service.js';
import { emailWorker } from './infra/queues/email-queue.js';
import { auditWorker } from './infra/queues/audit-queue.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './infra/http/swagger.js';
import { AuditService } from './audit/application/audit-service.js';

const app = express();

const bookingRepository = new PostgresBookingRepository(db);
const lockService = new RedisLockService(redis);
const bookingService = new BookingService(bookingRepository, lockService);
const emailService = new EmailService();
const auditService = new AuditService();
const healthController = new HealthController(db, redis);
const movieRepository = new PostgresMovieRepository(db);
const movieController = new MovieController(movieRepository);
const roomRepository = new PostgresRoomRepository(db);
const roomController = new RoomController(roomRepository);

const httpServer = createServer(app);

const io = await setupWebSocket(httpServer);
const broadcast = createBroadcast(io);
startKeyspaceListener(io);

const bookingController = new BookingController(
  bookingService,
  broadcast,
  emailService,
  auditService
);
const lockController = new LockController(lockService, broadcast, auditService);

app.use(cors());
app.use(pinoHttp({ logger, autoLogging: false }));
app.use(express.json());
app.use('/bookings', bookingRoutes(bookingController));
app.use('/locks', lockRoutes(lockController));
app.use('/movies', movieRoutes(movieController));
app.use('/rooms', roomRoutes(roomController));

logger.info('Email worker initialized');

app.get('/health', (req, res) => healthController.check(req, res));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

httpServer.listen(env.PORT, () => {
  logger.info(`Server running on port: ${env.PORT}`);
});
