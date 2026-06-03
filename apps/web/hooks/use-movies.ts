import { useEffect, useState } from "react";

interface Movie {
  id: string;
  title: string;
  description?: string;
  duration: number;
  releaseDate: string;
  genre?: string;
  rating?: string;
  bannerUrl?: string;
}

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/movies`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch movies");
        }
        const data = await response.json();
        setMovies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

  return { movies, loading, error };
}
