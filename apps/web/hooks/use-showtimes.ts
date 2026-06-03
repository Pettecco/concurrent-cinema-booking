import { useEffect, useState } from "react";

interface Showtime {
  id: string;
  roomId: string;
  startTime: string;
  endTime: string;
}

export function useShowtimes(roomId: string | null) {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    async function fetchShowtimes() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/showtimes/room/${roomId}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch showtimes");
        }
        const data = await response.json();
        setShowtimes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchShowtimes();
  }, [roomId]);

  return { showtimes, loading, error };
}
