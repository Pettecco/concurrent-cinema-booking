import type { Server } from 'socket.io';
import { Redis } from 'ioredis';
import { env } from '../env.js';
import { logger } from '../http/logger.js';

export function startKeyspaceListener(io: Server) {
  const subscriber = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  });

  subscriber.psubscribe('__keyevent@0__:expired');

  subscriber.on('pmessage', (_pattern, _channel, key: string) => {
    if (!key.startsWith('lock:')) return;

    const parts = key.split(':');
    if (parts.length < 3) return;

    const movieId = parts[1]!;
    const seatId = parts[2]!;

    logger.info(
      { movieId, seatId, key },
      'Lock expired via keyspace notification'
    );

    io.to(movieId).emit('lock_expired', {
      type: 'lock_expired',
      movieId,
      seatId,
    });
  });

  subscriber.on('error', err => {
    logger.error({ err }, 'Keyspace listener error');
  });

  logger.info('Keyspace listener started');

  return subscriber;
}
