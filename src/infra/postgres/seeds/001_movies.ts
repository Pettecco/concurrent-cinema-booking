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
        'A criminal pleads insanity and is sent to a mental institution, where he rebels against the oppressive nurse and rallies up the scared patients.',
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
        'A young African-American man grapples with his identity and sexuality while experiencing the everyday struggles of childhood, adolescence, and burgeoning adulthood.',
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
        'Sophie reflects on the shared joy and private melancholy of a holiday she took with her father twenty years earlier.',
      duration: 102,
      release_date: '2022-10-21',
      genre: 'Drama',
      rating: '14',
      banner_url:
        'https://image.tmdb.org/t/p/original/hcGyKiQo6x9AL5GlssgBW3OAB4v.jpg',
    },
  ]);
}
