"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFetch } from "@/hooks/use-fetch";

interface Showtime {
  id: string;
  roomId: string;
  startTime: string;
  endTime: string;
}

interface Room {
  id: string;
  name: string;
  movieId: string;
  totalSeats: number;
  layout?: string;
}

interface ShowtimeDialogProps {
  movieId: string | null;
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
  const { data: room, loading: roomLoading } = useFetch<Room>(
    open && movieId ? `rooms/movie/${movieId}` : null,
  );

  const {
    data: showtimes,
    loading: showtimesLoading,
    error: showtimesError,
  } = useFetch<Showtime[]>(room?.id ? `showtimes/room/${room.id}` : null);

  const loading = roomLoading || showtimesLoading;

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

        {showtimesError && (
          <p className="py-6 text-center text-xl font-semibold text-imperial-red">
            {showtimesError?.message}
          </p>
        )}

        {!loading && !showtimesError && showtimes?.length === 0 && (
          <p className="py-6 text-center text-xl font-semibold text-gray">
            Nenhum horário disponível
          </p>
        )}

        {!loading && !showtimesError && showtimes && showtimes.length > 0 && (
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
