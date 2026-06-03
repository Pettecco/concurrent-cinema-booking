"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Showtime {
  id: string;
  roomId: string;
  startTime: string;
  endTime: string;
}

interface ShowtimeDialogProps {
  movieId: string;
  movieTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectShowtime?: (showtime: Showtime, roomId: string) => void;
}

export function ShowtimeDialog({
  movieId,
  movieTitle,
  open,
  onOpenChange,
  onSelectShowtime,
}: ShowtimeDialogProps) {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !movieId) return;

    async function fetchShowtimes() {
      setLoading(true);
      setError(null);
      try {
        const roomRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/rooms/movie/${movieId}`,
        );
        if (!roomRes.ok) throw new Error("Sala não encontrada");

        const room = await roomRes.json();

        const showtimesRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/showtimes/room/${room.id}`,
        );
        if (!showtimesRes.ok) throw new Error("Failed to fetch showtimes");

        const data = await showtimesRes.json();
        setShowtimes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    }

    fetchShowtimes();
  }, [open, movieId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background-2 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold text-imperial-red">
            {movieTitle}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-imperial-red border-t-transparent" />
          </div>
        )}

        {error && (
          <p className="py-6 text-center text-xl font-semibold text-imperial-red">
            {error}
          </p>
        )}

        {!loading && !error && showtimes.length === 0 && (
          <p className="py-6 text-center text-xl font-semibold text-gray">
            Nenhum horário disponível
          </p>
        )}

        {!loading && !error && showtimes.length > 0 && (
          <div className="flex flex-col gap-4 py-4">
            {showtimes.map((st) => (
              <button
                key={st.id}
                onClick={() => onSelectShowtime?.(st, st.roomId)}
                className="rounded-xl border border-background-3 bg-background-3 px-8 py-6 text-center text-2xl font-bold text-white transition-all hover:border-imperial-red hover:bg-imperial-red/10"
              >
                <span>{st.startTime}</span>
                <span className="ml-4 text-lg font-semibold text-gray">
                  — {st.endTime}
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
