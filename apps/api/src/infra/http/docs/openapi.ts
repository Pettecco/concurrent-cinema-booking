import type { OpenAPIV3 } from 'openapi-types';

export const healthDocs: OpenAPIV3.PathsObject = {
  '/health': {
    get: {
      summary: 'Health check',
      description: 'Checks the health status of the API and its dependencies (PostgreSQL, Redis)',
      tags: ['Health'],
      responses: {
        200: {
          description: 'All systems healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'ok' },
                  checks: {
                    type: 'object',
                    properties: {
                      postgres: {
                        type: 'object',
                        properties: {
                          status: { type: 'string', example: 'ok' },
                        },
                      },
                      redis: {
                        type: 'object',
                        properties: {
                          status: { type: 'string', example: 'ok' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        503: {
          description: 'Service unavailable',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'error' },
                  checks: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
  },
};
