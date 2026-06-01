import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
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
  },
  apis: [
    './src/booking/presentation/controllers/*.ts',
    './src/room/presentation/controllers/*.ts',
    './src/movie/presentation/controllers/*.ts',
    './src/infra/http/*.ts',
  ],
});
