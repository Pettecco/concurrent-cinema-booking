"use client";

import { useRouter } from "next/navigation";
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

interface Movie {
  id: string;
  title: string;
  description?: string;
}

interface ShowtimeDialogProps {
  movieId: string | null;
  movieTitle: string;
  movieDescription?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShowtimeDialog({
  movieId,
  movieTitle,
  movieDescription,
  open,
  onOpenChange,
}: ShowtimeDialogProps) {
  const router = useRouter();

  const { data: room, loading: roomLoading } = useFetch<Room>(
    open && movieId ? `rooms/movie/${movieId}` : null,
  );

  const {
    data: showtimes,
    loading: showtimesLoading,
    error: showtimesError,
  } = useFetch<Showtime[]>(room?.id ? `showtimes/room/${room.id}` : null);

  const loading = roomLoading || showtimesLoading;

  const handleSelectShowtime = (showtime: Showtime) => {
    if (!movieId) return;
    onOpenChange(false);
    router.push(`/movies/${movieId}/showtimes/${showtime.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background-2 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold text-imperial-red leading-tight">
            {movieTitle}
          </DialogTitle>
          {movieDescription && (
            <p className="text-center text-sm text-gray leading-relaxed">
              {movieDescription}
            </p>
          )}
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-imperial-red border-t-transparent" />
          </div>
        )}

        {showtimesError && (
          <p className="py-4 text-center text-base font-semibold text-imperial-red">
            {showtimesError?.message}
          </p>
        )}

        {!loading && !showtimesError && showtimes?.length === 0 && (
          <p className="py-4 text-center text-base font-semibold text-gray">
            Nenhum horário disponível
          </p>
        )}

        {!loading && !showtimesError && showtimes && showtimes.length > 0 && (
          <div className="flex flex-col gap-3 py-2">
            {showtimes.map((st) => (
              <button
                key={st.id}
                onClick={() => handleSelectShowtime(st)}
                className="rounded-lg border border-background-3 bg-background-3 px-6 py-4 text-center text-lg font-bold text-white transition-all hover:border-imperial-red hover:bg-imperial-red/10"
              >
                <span>{st.startTime}</span>
                <span className="ml-3 text-sm font-semibold text-gray">
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
