import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {

  await knex('rooms').insert([
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: "Sala 1 - One Flew Over the Cuckoo's Nest",
      movie_id: '550e8400-e29b-41d4-a716-446655440001',
      total_seats: 25,
      layout: '5x5',
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      name: 'Sala 2 - Moonlight',
      movie_id: '550e8400-e29b-41d4-a716-446655440002',
      total_seats: 20,
      layout: '4x5',
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      name: 'Sala 3 - Aftersun',
      movie_id: '550e8400-e29b-41d4-a716-446655440003',
      total_seats: 15,
      layout: '3x5',
    },
  ]);

  await knex('showtimes').insert([
    {
      id: '8fa5eeb0-3bc4-4182-9cb9-7ba8f55ae873',
      room_id: '660e8400-e29b-41d4-a716-446655440001',
      start_time: '14:00',
      end_time: '16:00',
    },
    {
      id: '8fa5eeb0-3bc4-4182-9cb9-7ba8f55ae874',
      room_id: '660e8400-e29b-41d4-a716-446655440001',
      start_time: '17:00',
      end_time: '19:00',
    },
    {
      id: '8fa5eeb0-3bc4-4182-9cb9-7ba8f55ae875',
      room_id: '660e8400-e29b-41d4-a716-446655440001',
      start_time: '20:00',
      end_time: '22:00',
    },
    {
      id: knex.raw('gen_random_uuid()'),
      room_id: '660e8400-e29b-41d4-a716-446655440002',
      start_time: '15:00',
      end_time: '17:00',
    },
    {
      id: knex.raw('gen_random_uuid()'),
      room_id: '660e8400-e29b-41d4-a716-446655440002',
      start_time: '18:00',
      end_time: '20:00',
    },
    {
      id: knex.raw('gen_random_uuid()'),
      room_id: '660e8400-e29b-41d4-a716-446655440002',
      start_time: '21:00',
      end_time: '23:00',
    },
    {
      id: knex.raw('gen_random_uuid()'),
      room_id: '660e8400-e29b-41d4-a716-446655440003',
      start_time: '16:00',
      end_time: '18:00',
    },
    {
      id: knex.raw('gen_random_uuid()'),
      room_id: '660e8400-e29b-41d4-a716-446655440003',
      start_time: '19:00',
      end_time: '21:00',
    },
    {
      id: knex.raw('gen_random_uuid()'),
      room_id: '660e8400-e29b-41d4-a716-446655440003',
      start_time: '22:00',
      end_time: '00:00',
    },
  ]);
}
