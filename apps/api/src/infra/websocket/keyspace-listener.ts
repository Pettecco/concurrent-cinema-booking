import type { Server } from 'socket.io';
import { Redis } from 'ioredis';
import { env } from '../env.js';
import { logger } from '../http/logger.js';
import { auditQueue } from '../queues/audit-queue.js';

export function startKeyspaceListener(io: Server) {
  const subscriber = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  });

  subscriber.psubscribe('__keyevent@0__:expired');

  subscriber.on('pmessage', (_pattern, _channel, key: string) => {
    if (!key.startsWith('lock:')) return;

    const parts = key.split(':');
    if (parts.length < 5) return;

    const roomId = parts[1]!;
    const showtimeId = parts[2]!;
    const seatId = parts[3]!;
    const userId = parts[4]!;

    logger.info(
      { roomId, seatId, key },
      'Lock expired via keyspace notification'
    );

    io.to(roomId).emit('lock_expired', {
      type: 'lock_expired',
      roomId,
      seatId,
    });

    auditQueue.add('audit-event', {
      eventType: 'lock.expired',
      payload: { roomId, showtimeId, seatId, userId, reason: 'ttl_expired' },
    }).catch((err) => {
      logger.error({ err }, 'Failed to enqueue lock.expired audit event');
    });
  });

  subscriber.on('error', err => {
    logger.error({ err }, 'Keyspace listener error');
  });

  logger.info('Keyspace listener started');

  return subscriber;
}
