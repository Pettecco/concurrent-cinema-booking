export interface Room {
  id: string;
  name: string;
  movieId: string;
  totalSeats: number;
  layout?: string; // seat layout (e.g., "5x10")
  showtimes: string[]; // screening times (e.g., ["14:00", "17:00", "20:00"])
}
