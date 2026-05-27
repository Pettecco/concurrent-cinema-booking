import type {
  ErrorRequestHandler,
  Request,
  Response,
  NextFunction,
} from 'express';
import { logger } from './logger.js';
import {
  DomainError,
  SeatAlreadyBookedError,
  SeatLockedError,
  BookingNotFoundError,
} from '../../booking/domain/errors.js';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

function buildErrorResponse(error: Error): ErrorResponse {
  if (error instanceof SeatAlreadyBookedError) {
    return {
      error: {
        code: 'SEAT_ALREADY_BOOKED',
        message: error.message,
      },
    };
  }

  if (error instanceof SeatLockedError) {
    return {
      error: {
        code: 'SEAT_LOCKED',
        message: error.message,
      },
    };
  }

  if (error instanceof BookingNotFoundError) {
    return {
      error: {
        code: 'BOOKING_NOT_FOUND',
        message: error.message,
      },
    };
  }

  if (error instanceof DomainError) {
    return {
      error: {
        code: 'DOMAIN_ERROR',
        message: error.message,
      },
    };
  }

  if ((error as any).code === '23505') {
    return {
      error: {
        code: 'SEAT_ALREADY_BOOKED',
        message: 'Seat is already booked',
      },
    };
  }

  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  };
}

function getStatusCode(error: Error): number {
  if (error instanceof SeatAlreadyBookedError) return 409;
  if (error instanceof SeatLockedError) return 409;
  if (error instanceof BookingNotFoundError) return 404;
  if (error instanceof DomainError) return 400;
  if ((error as any).code === '23505') return 409;
  return 500;
}

export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = getStatusCode(error);
  const response = buildErrorResponse(error);

  if (statusCode >= 500) {
    logger.error(
      {
        err: error,
        req: {
          method: req.method,
          url: req.url,
          params: req.params,
          query: req.query,
        },
      },
      'Unhandled error'
    );
  } else {
    logger.warn(
      {
        err: error,
        req: {
          method: req.method,
          url: req.url,
        },
        statusCode,
      },
      'Handled error'
    );
  }

  return res.status(statusCode).json(response);
};
