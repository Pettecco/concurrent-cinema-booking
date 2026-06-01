import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('rooms', table => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.uuid('movie_id').notNullable();
    table.integer('total_seats').notNullable();
    table.string('layout'); // seat layout (e.g., "5x10")
    table.jsonb('showtimes').notNullable(); // screening times (e.g., ["14:00", "17:00", "20:00"])
    table.timestamps(true, true);

    table.foreign('movie_id').references('id').inTable('movies');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('rooms');
}
