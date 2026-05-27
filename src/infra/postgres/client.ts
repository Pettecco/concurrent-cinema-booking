import knex from 'knex';
import { env } from '../env.js';
import { logger } from '../http/logger.js';

export const db = knex({
  client: 'pg',
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  },
  log: {
    warn(message: string) {
      logger.warn(message);
    },
    error(message: string) {
      logger.error(message);
    },
    deprecate(message: string) {
      logger.warn({ deprecation: true }, message);
    },
    debug(message: string) {
      logger.debug(message);
    },
  },
});
