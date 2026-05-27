export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class SeatAlreadyBookedError extends DomainError {
  constructor(movieId: string, seatId: string) {
    super(`Seat ${seatId} is already booked for movie ${movieId}`);
    this.name = 'SeatAlreadyBookedError';
  }
}

export class SeatLockedError extends DomainError {
  constructor(movieId: string, seatId: string) {
    super(`Seat ${seatId} is currently locked for movie ${movieId}`);
    this.name = 'SeatLockedError';
  }
}

export class BookingNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Booking ${id} not found`);
    this.name = 'BookingNotFoundError';
  }
}

export class LockNotOwnedError extends DomainError {
  constructor(key: string, userId: string) {
    super(`Lock ${key} is not owned by user ${userId}`);
    this.name = 'LockNotOwnedError';
  }
}
