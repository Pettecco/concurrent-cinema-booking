import type { OpenAPIV3 } from 'openapi-types';

export const bookingDocs: OpenAPIV3.PathsObject = {
  '/bookings': {
    post: {
      summary: 'Create a new booking',
      description: 'Books a seat for a showtime',
      tags: ['Bookings'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                roomId: { type: 'string', format: 'uuid' },
                showtimeId: { type: 'string', format: 'uuid' },
                seatId: { type: 'string' },
                userId: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
              },
              required: ['roomId', 'showtimeId', 'seatId', 'userId', 'email'],
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Booking created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Booking' },
            },
          },
        },
        400: {
          description: 'Invalid request body',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        409: {
          description: 'Seat already booked or locked',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
  },
  '/bookings/{roomId}': {
    get: {
      summary: 'List bookings by room',
      description: 'Returns all bookings for a specific room',
      tags: ['Bookings'],
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
          description: 'List of bookings',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Booking' },
              },
            },
          },
        },
        400: {
          description: 'Invalid room ID',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
  },
};
