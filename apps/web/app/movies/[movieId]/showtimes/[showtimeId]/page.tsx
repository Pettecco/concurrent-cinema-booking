"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";
import { SeatGrid } from "@/components/seats/seat-grid";

interface Booking {
  id: string;
  roomId: string;
  showtimeId: string;
  seatId: string;
  userId: string;
  email: string;
  status: string;
}

interface Room {
  id: string;
  name: string;
  movieId: string;
  totalSeats: number;
  layout: string;
}

interface Showtime {
  id: string;
  roomId: string;
  startTime: string;
  endTime: string;
}

interface Movie {
  id: string;
  title: string;
}

export default function SeatSelectionPage() {
  const params = useParams<{ movieId: string; showtimeId: string }>();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const movieId = Array.isArray(params.movieId)
    ? params.movieId[0]
    : params.movieId;
  const showtimeId = Array.isArray(params.showtimeId)
    ? params.showtimeId[0]
    : params.showtimeId;

  console.log("params:", { movieId, showtimeId });

  const {
    data: showtime,
    error: showtimeError,
    loading: showtimeLoading,
  } = useFetch<Showtime>(showtimeId ? `showtimes/${showtimeId}` : null);

  const {
    data: room,
    error: roomError,
    loading: roomLoading,
  } = useFetch<Room>(showtime?.roomId ? `rooms/${showtime.roomId}` : null);

  const {
    data: movie,
    error: movieError,
    loading: movieLoading,
  } = useFetch<Movie>(movieId ? `movies/${movieId}` : null);

  const { data: bookings, error: bookingsError } = useFetch<Booking[]>(
    showtime?.roomId ? `bookings/${showtime.roomId}` : null,
  );

  const error = showtimeError || roomError || movieError || bookingsError;

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
        <p className="text-2xl font-bold text-imperial-red">{error.message}</p>
        <button
          onClick={() => window.history.back()}
          className="rounded-xl bg-background-3 px-8 py-4 text-xl font-bold text-white transition-all hover:bg-imperial-red"
        >
          Voltar
        </button>
      </div>
    );
  }

  const bookedSeats = (bookings ?? [])
    .filter((b) => b.showtimeId === showtimeId)
    .map((b) => b.seatId);

  const handleToggleSeat = (seatId: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId],
    );
  };

  if (!room || !showtime || !movie) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-imperial-red border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8 py-12">
      <div className="-mt-12 mb-12 text-center">
        <h1 className="text-8xl font-bold text-imperial-red">{movie.title}</h1>
        <p className="mt-6 text-4xl text-gray">
          {showtime.startTime} — {showtime.endTime}
        </p>
        <p className="mt-3 text-3xl text-gray">{room.name}</p>
      </div>

      <SeatGrid
        layout={room.layout}
        bookedSeats={bookedSeats}
        selectedSeats={selectedSeats}
        onToggleSeat={handleToggleSeat}
        onClearSeats={() => setSelectedSeats([])}
      />

      {selectedSeats.length > 0 && (
        <div className="mt-16 flex flex-col items-center gap-8">
          <div className="flex items-center gap-4">
            <p className="text-3xl font-bold text-white">
              Selected: {selectedSeats.join(", ")}
            </p>
            <button
              onClick={() => setSelectedSeats([])}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background-3 text-xl font-bold text-gray transition-all hover:bg-imperial-red hover:text-white"
            >
              ✕
            </button>
          </div>
          <button className="rounded-xl bg-imperial-red px-16 py-8 text-3xl font-bold text-white transition-all hover:bg-imperial-red/80">
            Confirmar Reserva
          </button>
        </div>
      )}
    </div>
  );
}
