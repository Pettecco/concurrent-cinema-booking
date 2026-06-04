import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('bookings').del();
  await knex('showtimes').del();
  await knex('rooms').del();
  await knex('movies').del();

  await knex('movies').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: "One Flew Over the Cuckoo's Nest",
      description:
        'Um criminoso finge insanidade e é enviado para uma instituição psiquiátrica, onde se rebela contra a enfermeira opressora e inspira os pacientes amedrontados a enfrentarem o sistema.',
      duration: 133,
      release_date: '1975-11-19',
      genre: 'Drama',
      rating: '16',
      banner_url:
        'https://media.themoviedb.org/t/p/original/3jcbDmRFiQ83drXNOvRDeKHxS0C.jpg',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Moonlight',
      description:
        'Um jovem afro-americano lida com questões de identidade e sexualidade enquanto enfrenta os desafios da infância, adolescência e início da vida adulta.',
      duration: 111,
      release_date: '2016-10-21',
      genre: 'Drama',
      rating: '16',
      banner_url:
        'https://image.tmdb.org/t/p/original/AekOkoT88EhDHikUQXQcKri2q4B.jpg',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Aftersun',
      description:
        'Sophie relembra os momentos de alegria compartilhada e a melancolia silenciosa de uma viagem de férias que fez com seu pai vinte anos antes.',
      duration: 102,
      release_date: '2022-10-21',
      genre: 'Drama',
      rating: '14',
      banner_url:
        'https://image.tmdb.org/t/p/original/hcGyKiQo6x9AL5GlssgBW3OAB4v.jpg',
    },
  ]);
}
