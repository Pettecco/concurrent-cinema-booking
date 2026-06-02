import type { Knex } from 'knex';
import { env } from './src/infra/env.js';

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  },
  migrations: {
    directory: './src/infra/postgres/migrations',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
  seeds: {
    directory: './src/infra/postgres/seeds',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
};

export default config;
