export interface Booking {
  id: string;
  roomId: string;
  showtimeId: string;
  seatId: string;
  userId: string;
  email: string;
  status: string;
}

export interface Room {
  id: string;
  name: string;
  movieId: string;
  totalSeats: number;
  layout: string;
}

export interface Showtime {
  id: string;
  roomId: string;
  startTime: string;
  endTime: string;
}

export interface Movie {
  id: string;
  title: string;
}

export interface ActiveLock {
  seatId: string;
  userId: string;
  ttl: number;
}
