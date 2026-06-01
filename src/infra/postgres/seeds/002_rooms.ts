import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('rooms').del();

  await knex('rooms').insert([
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: "Sala 1 - One Flew Over the Cuckoo's Nest",
      movie_id: '550e8400-e29b-41d4-a716-446655440001',
      total_seats: 25,
      layout: '5x5',
      showtimes: JSON.stringify(['14:00', '17:00', '20:00']),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      name: 'Sala 2 - Moonlight',
      movie_id: '550e8400-e29b-41d4-a716-446655440002',
      total_seats: 20,
      layout: '4x5',
      showtimes: JSON.stringify(['15:00', '18:00', '21:00']),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      name: 'Sala 3 - Aftersun',
      movie_id: '550e8400-e29b-41d4-a716-446655440003',
      total_seats: 15,
      layout: '3x5',
      showtimes: JSON.stringify(['16:00', '19:00', '22:00']),
    },
  ]);
}
