"use client";

import { useState } from "react";

interface MovieCardProps {
  title: string;
  bannerUrl?: string;
  duration?: number;
  genre?: string;
  rating?: string;
  onClick?: () => void;
}

export function MovieCard({
  title,
  bannerUrl,
  duration,
  genre,
  rating,
  onClick,
}: MovieCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg bg-background-2 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-imperial-red/20">
      <div className="aspect-[2/3] w-full overflow-hidden bg-background-3">
        <img
          src={bannerUrl}
          alt={title}
          className={`h-full w-full object-cover transition-all duration-500 ${
            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
          } group-hover:scale-110`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-background-3" />
        )}
      </div>

      {(duration || genre || rating) && (
        <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/90 to-black/60 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="text-sm font-medium text-white">{duration} min</span>
          <span className="text-sm font-medium text-white">{genre}</span>
          <span className="rounded bg-imperial-red px-3 py-1 text-sm font-semibold text-white">
            {rating}
          </span>
        </div>
      )}
    </div>
  );
}
