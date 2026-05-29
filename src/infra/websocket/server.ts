import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { env } from '../env.js';
import { logger } from '../http/logger.js';
import { clientToServerSchema } from './types.js';

let io: Server | null = null;

export async function setupWebSocket(httpServer: HttpServer): Promise<Server> {
  const pubClient = createClient({
    url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
  });
  const subClient = pubClient.duplicate();

  pubClient.on('error', err => logger.error({ err }, 'Redis pub client error'));
  subClient.on('error', err => logger.error({ err }, 'Redis sub client error'));

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io = new Server(httpServer, {
    path: '/ws',
    cors: { origin: '*' },
    pingInterval: 30_000,
    pingTimeout: 5_000,
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', socket => {
    logger.info({ socketId: socket.id }, 'WebSocket client connected');

    socket.on('subscribe', (movieId: string) => {
      const parsed = clientToServerSchema.safeParse({
        type: 'subscribe',
        movieId,
      });
      if (!parsed.success) {
        socket.emit('error', { message: 'Invalid subscribe payload' });
        return;
      }
      socket.join(movieId);
      logger.info(
        { socketId: socket.id, movieId },
        'Client subscribed to movie'
      );
    });

    socket.on('unsubscribe', (movieId: string) => {
      const parsed = clientToServerSchema.safeParse({
        type: 'unsubscribe',
        movieId,
      });
      if (!parsed.success) {
        socket.emit('error', { message: 'Invalid unsubscribe payload' });
        return;
      }
      socket.leave(movieId);
      logger.info(
        { socketId: socket.id, movieId },
        'Client unsubscribed from movie'
      );
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'WebSocket client disconnected');
    });
  });

  logger.info('WebSocket server initialized with Redis adapter');

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error(
      'WebSocket server not initialized. Call setupWebSocket() first.'
    );
  }
  return io;
}
