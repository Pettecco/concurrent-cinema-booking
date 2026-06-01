export interface Room {
  id: string;
  name: string;
  movieId: string;
  totalSeats: number;
  layout?: string; // seat layout (e.g., "5x10")
}
