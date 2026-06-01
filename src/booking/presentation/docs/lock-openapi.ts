import type { OpenAPIV3 } from 'openapi-types';

export const lockDocs: OpenAPIV3.PathsObject = {
  '/locks': {
    post: {
      summary: 'Acquire seat lock',
      description: 'Locks a seat for 5 minutes. User must release or it expires automatically.',
      tags: ['Locks'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['roomId', 'showtimeId', 'seatId', 'userId'],
              properties: {
                roomId: { type: 'string', format: 'uuid', example: '660e8400-e29b-41d4-a716-446655440001' },
                showtimeId: { type: 'string', format: 'uuid', example: '8fa5eeb0-3bc4-4182-9cb9-7ba8f55ae873' },
                seatId: { type: 'string', example: 'A1' },
                userId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440100' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Lock acquired',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Lock' },
            },
          },
        },
        400: { description: 'Invalid input' },
        409: { description: 'Seat already locked' },
      },
    },
    delete: {
      summary: 'Release seat lock',
      description: 'Releases a lock on a seat. Only the user who acquired the lock can release it.',
      tags: ['Locks'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['roomId', 'showtimeId', 'seatId', 'userId'],
              properties: {
                roomId: { type: 'string', format: 'uuid' },
                showtimeId: { type: 'string', format: 'uuid' },
                seatId: { type: 'string' },
                userId: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Lock released successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  roomId: { type: 'string' },
                  showtimeId: { type: 'string' },
                  seatId: { type: 'string' },
                  userId: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'Invalid input' },
        403: { description: 'Lock not owned by user' },
      },
    },
  },
};
