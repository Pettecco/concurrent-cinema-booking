export interface Movie {
  id: string;
  title: string;
  description?: string;
  duration: number; // in minutes
  releaseDate: Date;
  genre?: string;
  rating?: string;
  bannerUrl?: string; // movie banner image
}
