import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('movies', table => {
    table.uuid('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.integer('duration').notNullable(); // in minutes
    table.date('release_date').notNullable();
    table.string('genre');
    table.string('rating');
    table.string('banner_url'); // movie banner image
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('movies');
}
