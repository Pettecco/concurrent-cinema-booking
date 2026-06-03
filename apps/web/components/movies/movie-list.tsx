"use client";

import { useMovies } from "@/hooks/use-movies";
import { MovieCard } from "./movie-card";
import { MovieSkeleton } from "./movie-skeleton";

export function MovieList() {
  const { movies, loading, error } = useMovies();

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-imperial-red">
        <p>Failed to load movies: {error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3">
      {loading
        ? Array.from({ length: 3 }).map((_, i) => <MovieSkeleton key={i} />)
        : movies.map((movie, index) => (
            <div
              key={movie.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <MovieCard
                title={movie.title}
                bannerUrl={movie.bannerUrl}
                duration={movie.duration}
                genre={movie.genre}
                rating={movie.rating}
              />
            </div>
          ))}
    </div>
  );
}
