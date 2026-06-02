import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('bookings', table => {
    table
      .uuid('showtime_id')
      .notNullable()
      .defaultTo(knex.raw('gen_random_uuid()'));
    table
      .foreign('showtime_id')
      .references('id')
      .inTable('showtimes')
      .onDelete('CASCADE');
  });

  const bookings = await knex('bookings').select('id', 'room_id');
  for (const booking of bookings) {
    const firstShowtime = await knex('showtimes')
      .where('room_id', booking.room_id)
      .orderBy('start_time')
      .first();

    if (firstShowtime) {
      await knex('bookings')
        .where('id', booking.id)
        .update({ showtime_id: firstShowtime.id });
    }
  }

  await knex.schema.alterTable('bookings', table => {
    table.uuid('showtime_id').notNullable().alter();
  });

  await knex.schema.alterTable('bookings', table => {
    table.dropUnique(['room_id', 'seat_id']);
    table.unique(['showtime_id', 'seat_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('bookings', table => {
    table.dropUnique(['showtime_id', 'seat_id']);
    table.unique(['room_id', 'seat_id']);
  });

  await knex.schema.alterTable('bookings', table => {
    table.dropForeign('showtime_id');
    table.dropColumn('showtime_id');
  });
}
