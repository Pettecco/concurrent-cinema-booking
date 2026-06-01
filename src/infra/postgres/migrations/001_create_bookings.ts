import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('bookings', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('room_id').notNullable();
    table.string('seat_id').notNullable();
    table.string('user_id').notNullable();
    table.string('status').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.uuid('room_id').references('id').inTable('rooms');
    table.unique(['room_id', 'seat_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('bookings');
}
