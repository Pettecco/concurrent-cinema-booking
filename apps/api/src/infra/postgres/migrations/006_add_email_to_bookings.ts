import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('bookings', (table) => {
    table.string('email').notNullable().defaultTo('');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('bookings', (table) => {
    table.dropColumn('email');
  });
}
