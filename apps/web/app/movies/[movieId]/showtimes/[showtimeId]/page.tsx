"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useFetch } from "@/hooks/use-fetch";
import { useLock } from "@/hooks/use-lock";
import { useWebSocket } from "@/hooks/use-websocket";
import { SeatGrid } from "@/components/seats/seat-grid";
import type { Booking, Room, Showtime, Movie } from "@/types/cinema";

function useSeatSelection(movieId: string | null, showtimeId: string | null) {
  const { subscribe, events } = useWebSocket();
  const [remoteLockedSeats, setRemoteLockedSeats] = useState<string[]>([]);

  const { data: showtime, error: showtimeError } = useFetch<Showtime>(
    showtimeId ? `showtimes/${showtimeId}` : null,
  );

  const { data: room, error: roomError } = useFetch<Room>(
    showtime?.roomId ? `rooms/${showtime.roomId}` : null,
  );

  const { data: movie, error: movieError } = useFetch<Movie>(
    movieId ? `movies/${movieId}` : null,
  );

  const { data: bookings, error: bookingsError } = useFetch<Booking[]>(
    showtime?.roomId ? `bookings/${showtime.roomId}` : null,
  );

  const {
    lockedSeats,
    lockSeat,
    unlockSeat,
    unlockAll,
    isLocked,
    getRemainingTime,
  } = useLock(showtime?.roomId ?? null, showtimeId);

  useEffect(() => {
    if (!room?.id || !showtimeId) return;

    subscribe(room.id);

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/locks?roomId=${room.id}&showtimeId=${showtimeId}`,
    )
      .then((res) => res.json())
      .then((data: { seatId: string }[]) => {
        setRemoteLockedSeats(data.map((d) => d.seatId));
      });
  }, [room?.id, showtimeId, subscribe]);

  useEffect(() => {
    if (!events.length) return;

    const lastEvent = events[events.length - 1];
    if ("roomId" in lastEvent && lastEvent.roomId !== room?.id) return;

    switch (lastEvent.type) {
      case "seat_locked":
        setRemoteLockedSeats((prev) => {
          if (prev.includes(lastEvent.seatId)) return prev;
          return [...prev, lastEvent.seatId];
        });
        break;
      case "seat_released":
      case "lock_expired":
      case "seat_booked":
        setRemoteLockedSeats((prev) =>
          prev.filter((s) => s !== lastEvent.seatId),
        );
        break;
    }
  }, [events, room?.id]);

  const allBookedSeats = useMemo(
    () => [
      ...new Set([
        ...(bookings ?? [])
          .filter((b) => b.showtimeId === showtimeId)
          .map((b) => b.seatId),
      ]),
    ],
    [bookings, showtimeId],
  );

  const allLockedSeats = useMemo(
    () => [...new Set([...lockedSeats, ...remoteLockedSeats])],
    [lockedSeats, remoteLockedSeats],
  );

  return {
    showtime,
    room,
    movie,
    allBookedSeats,
    allLockedSeats,
    lockedSeats,
    lockSeat,
    unlockSeat,
    unlockAll,
    isLocked,
    getRemainingTime,
    error: showtimeError || roomError || movieError || bookingsError,
  };
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-imperial-red border-t-transparent" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <p className="text-2xl font-bold text-imperial-red">{message}</p>
      <button
        onClick={() => window.history.back()}
        className="cursor-pointer rounded-xl bg-background-3 px-8 py-4 text-xl font-bold text-white transition-all hover:bg-imperial-red"
      >
        Voltar
      </button>
    </div>
  );
}

export default function SeatSelectionPage() {
  const params = useParams<{ movieId: string; showtimeId: string }>();
  const [confirming, setConfirming] = useState(false);

  const movieId = Array.isArray(params.movieId)
    ? params.movieId[0]
    : params.movieId;
  const showtimeId = Array.isArray(params.showtimeId)
    ? params.showtimeId[0]
    : params.showtimeId;

  const {
    showtime,
    room,
    movie,
    allBookedSeats,
    allLockedSeats,
    lockedSeats,
    lockSeat,
    unlockSeat,
    unlockAll,
    isLocked,
    getRemainingTime,
    error,
  } = useSeatSelection(movieId, showtimeId);

  const handleToggleSeat = async (seatId: string) => {
    if (!showtime?.roomId || !showtimeId) return;

    if (isLocked(seatId)) {
      await unlockSeat({ roomId: showtime.roomId, showtimeId, seatId });
    } else {
      await lockSeat({ roomId: showtime.roomId, showtimeId, seatId });
    }
  };

  const handleConfirmBooking = async () => {
    if (!showtime?.roomId || !showtimeId) return;
    setConfirming(true);

    for (const seatId of lockedSeats) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: showtime.roomId,
          showtimeId,
          seatId,
          userId: "user-id-here",
          email: "user@email.com",
        }),
      });
    }

    setConfirming(false);
  };

  if (error) {
    return <ErrorState message={error.message} />;
  }

  if (!room || !showtime || !movie) {
    return <LoadingSpinner />;
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
        bookedSeats={allBookedSeats}
        lockedSeats={allLockedSeats}
        myLockedSeats={lockedSeats}
        onToggleSeat={handleToggleSeat}
      />

      {lockedSeats.length > 0 && (
        <div className="mt-16 flex flex-col items-center gap-8">
          <div className="flex items-center gap-6">
            <p className="text-3xl font-bold text-white">
              Selecionado: {lockedSeats.join(", ")}
            </p>
            <span className="rounded-xl bg-carrow-orange/20 px-6 py-3 text-2xl font-bold text-carrow-orange">
              {getRemainingTime()}
            </span>
            <button
              onClick={unlockAll}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-background-3 text-xl font-bold text-gray transition-all hover:bg-imperial-red hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-xl text-gray text-center max-w-xl">
            Seus assentos estão reservados por{" "}
            <span className="text-carrow-orange font-semibold">5 minutos</span>.
            Após esse tempo, a reserva será liberada automaticamente.
          </p>
          <button
            onClick={handleConfirmBooking}
            disabled={confirming}
            className="cursor-pointer rounded-xl bg-imperial-red px-16 py-8 text-3xl font-bold text-white transition-all hover:bg-imperial-red/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirming ? "Reservando..." : "Confirmar Reserva"}
          </button>
        </div>
      )}
    </div>
  );
}
