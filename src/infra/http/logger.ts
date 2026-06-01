import pino from 'pino';
import { env } from '../env.js';

export type Logger = pino.Logger;

const isDevelopment = env.NODE_ENV !== 'production';

export const logger = isDevelopment
  ? pino({
      level: env.LOG_LEVEL,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    })
  : pino({
      level: env.LOG_LEVEL,
    });
