"use client";

import { useState } from "react";
import { MovieCard } from "./movie-card";
import { MovieSkeleton } from "./movie-skeleton";
import { ShowtimeDialog } from "./showtime-dialog";
import { useFetch } from "@/hooks/use-fetch";

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

export const MovieList = () => {
  const { data: movies, loading, error } = useFetch<Movie[]>("movies");
  const [selectedMovie, setSelectedMovie] = useState<{
    id: string;
    title: string;
    description?: string;
  } | null>(null);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-imperial-red">
        <p>Failed to load movies: {error.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto grid max-w-350 grid-cols-1 gap-12 px-6 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <MovieSkeleton key={i} />)
          : movies?.map((movie, index) => (
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
                  onClick={() =>
                    setSelectedMovie({
                      id: movie.id,
                      title: movie.title,
                      description: movie.description,
                    })
                  }
                />
              </div>
            ))}
      </div>

      <ShowtimeDialog
        movieId={selectedMovie?.id ?? null}
        movieTitle={selectedMovie?.title ?? ""}
        movieDescription={selectedMovie?.description}
        open={!!selectedMovie}
        onOpenChange={(open) => {
          if (!open) setSelectedMovie(null);
        }}
      />
    </>
  );
};
