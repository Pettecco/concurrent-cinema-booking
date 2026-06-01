import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('showtimes', (table) => {
    table.uuid('id').primary();
    table.uuid('room_id').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.timestamps(true, true);

    table
      .foreign('room_id')
      .references('id')
      .inTable('rooms')
      .onDelete('CASCADE');
    table.unique(['room_id', 'start_time']);
  });

  const rooms = await knex.select('id', 'movie_id', 'showtimes').from('rooms');

  for (const room of rooms) {
    // Get movie duration from movies table
    const movie = await knex
      .select('duration')
      .from('movies')
      .where('id', room.movie_id)
      .first();
    const duration = movie?.duration || 120;

    const times = room.showtimes as string[];

    for (const startTime of times) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startMinutes = hours! * 60 + minutes!;
      const endMinutes = startMinutes + duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      await knex
        .insert({
          id: knex.raw('gen_random_uuid()'),
          room_id: room.id,
          start_time: startTime,
          end_time: endTime,
        })
        .into('showtimes');
    }
  }

  await knex.schema.alterTable('rooms', (table) => {
    table.dropColumn('showtimes');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('rooms', (table) => {
    table.jsonb('showtimes').notNullable().defaultTo('[]');
  });

  const showtimesByRoom = await knex('showtimes')
    .select('room_id', 'start_time')
    .orderBy('start_time');

  const roomShowtimes = new Map<string, string[]>();
  for (const st of showtimesByRoom) {
    const existing = roomShowtimes.get(st.room_id) || [];
    existing.push(st.start_time);
    roomShowtimes.set(st.room_id, existing);
  }

  for (const [roomId, times] of roomShowtimes.entries()) {
    await knex('rooms')
      .update({ showtimes: JSON.stringify(times) })
      .where('id', roomId);
  }

  await knex.schema.dropTable('showtimes');
}
