import type { OpenAPIV3 } from 'openapi-types';
import { bookingDocs } from '../../booking/presentation/docs/openapi.js';
import { lockDocs } from '../../booking/presentation/docs/lock-openapi.js';
import { movieDocs } from '../../movie/presentation/docs/openapi.js';
import { roomDocs } from '../../room/presentation/docs/openapi.js';
import { healthDocs } from './docs/openapi.js';

const paths: OpenAPIV3.PathsObject = {
  ...bookingDocs,
  ...lockDocs,
  ...movieDocs,
  ...roomDocs,
  ...healthDocs,
};

export const swaggerSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Cinema Booking API',
    version: '1.0.0',
    description:
      'API for concurrent cinema booking system with real-time seat locking',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  paths,
  components: {
    schemas: {
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          roomId: { type: 'string', format: 'uuid' },
          showtimeId: { type: 'string', format: 'uuid' },
          seatId: { type: 'string' },
          userId: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          status: { type: 'string' },
        },
        required: [
          'id',
          'roomId',
          'showtimeId',
          'seatId',
          'userId',
          'email',
          'status',
        ],
      },
      Lock: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          roomId: { type: 'string', format: 'uuid' },
          showtimeId: { type: 'string', format: 'uuid' },
          seatId: { type: 'string' },
          userId: { type: 'string', format: 'uuid' },
          expiresAt: { type: 'number' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                path: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      Room: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          movie_id: { type: 'string', format: 'uuid' },
          total_seats: { type: 'number' },
          layout: { type: 'string' },
        },
      },
      Movie: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          duration: { type: 'number' },
          release_date: { type: 'string', format: 'date' },
          genre: { type: 'string' },
          rating: { type: 'string' },
          banner_url: { type: 'string', format: 'uri' },
        },
      },
    },
  },
};
