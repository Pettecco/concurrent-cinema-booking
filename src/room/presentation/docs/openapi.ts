import type { OpenAPIV3 } from 'openapi-types';

export const roomDocs: OpenAPIV3.PathsObject = {
  '/rooms': {
    get: {
      summary: 'List all rooms',
      description: 'Returns all cinema rooms',
      tags: ['Rooms'],
      responses: {
        200: {
          description: 'List of all rooms',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Room' },
              },
            },
          },
        },
      },
    },
  },
  '/rooms/{id}': {
    get: {
      summary: 'Get room by ID',
      description: 'Returns a specific room by ID',
      tags: ['Rooms'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Room ID',
        },
      ],
      responses: {
        200: {
          description: 'Room details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Room' },
            },
          },
        },
        400: { description: 'Invalid room ID' },
        404: { description: 'Room not found' },
      },
    },
  },
  '/rooms/movie/{movieId}': {
    get: {
      summary: 'Get room by movie ID',
      description: 'Returns the room associated with a specific movie',
      tags: ['Rooms'],
      parameters: [
        {
          in: 'path',
          name: 'movieId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Movie ID',
        },
      ],
      responses: {
        200: {
          description: 'Room details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Room' },
            },
          },
        },
        400: { description: 'Invalid movie ID' },
        404: { description: 'Room not found for this movie' },
      },
    },
  },
};
