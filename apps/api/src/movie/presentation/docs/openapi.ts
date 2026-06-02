import type { OpenAPIV3 } from 'openapi-types';

export const movieDocs: OpenAPIV3.PathsObject = {
  '/movies': {
    get: {
      summary: 'List all movies',
      description: 'Returns all movies available in the cinema',
      tags: ['Movies'],
      responses: {
        200: {
          description: 'List of all movies',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Movie' },
              },
            },
          },
        },
      },
    },
  },
  '/movies/{id}': {
    get: {
      summary: 'Get movie by ID',
      description: 'Returns a specific movie by ID',
      tags: ['Movies'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Movie ID',
        },
      ],
      responses: {
        200: {
          description: 'Movie details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Movie' },
            },
          },
        },
        400: { description: 'Invalid movie ID' },
        404: { description: 'Movie not found' },
      },
    },
  },
};
