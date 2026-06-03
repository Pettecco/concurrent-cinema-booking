import type { OpenAPIV3 } from 'openapi-types';

export const showtimeDocs: OpenAPIV3.PathsObject = {
  '/showtimes/room/{roomId}': {
    get: {
      summary: 'List showtimes by room',
      description:
        'Returns all showtimes for a specific room, ordered by start time',
      tags: ['Showtimes'],
      parameters: [
        {
          in: 'path',
          name: 'roomId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Room ID',
        },
      ],
      responses: {
        200: {
          description: 'List of showtimes for the room',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Showtime' },
              },
            },
          },
        },
        400: { description: 'Invalid room ID' },
      },
    },
  },
  '/showtimes/{id}': {
    get: {
      summary: 'Get showtime by ID',
      description: 'Returns a specific showtime by ID',
      tags: ['Showtimes'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Showtime ID',
        },
      ],
      responses: {
        200: {
          description: 'Showtime details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Showtime' },
            },
          },
        },
        400: { description: 'Invalid showtime ID' },
        404: { description: 'Showtime not found' },
      },
    },
  },
};
