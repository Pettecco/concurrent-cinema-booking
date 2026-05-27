import type { Knex } from 'knex';

const development: Knex.Config = {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'cinema_booking',
  },
  migrations: {
    directory: './src/infra/postgres/migrations',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
};

export default development;
