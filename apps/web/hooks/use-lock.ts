import { useCallback, useEffect, useRef, useState } from "react";
import { useUserId } from "./use-user-id";

interface LockInput {
  roomId: string;
  showtimeId: string;
  seatId: string;
}

interface UseLockReturn {
  lockedSeats: string[];
  sessionExpiresAt: number | null;
  lockSeat: (input: LockInput) => Promise<boolean>;
  unlockSeat: (input: LockInput) => Promise<void>;
  unlockAll: () => Promise<void>;
  isLocked: (seatId: string) => boolean;
  getRemainingTime: () => string;
}

export function useLock(
  roomId: string | null,
  showtimeId: string | null,
): UseLockReturn {
  const userId = useUserId();
  const [lockedSeats, setLockedSeats] = useState<string[]>([]);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lockedSeatsRef = useRef<string[]>([]);

  // eslint-disable-next-line react-hooks/refs
  lockedSeatsRef.current = lockedSeats;

  useEffect(() => {
    if (!sessionExpiresAt) return;

    timerRef.current = setInterval(() => {
      setTick((t) => t + 1);
      if (Date.now() >= sessionExpiresAt) {
        const seatsToRelease = lockedSeatsRef.current;
        if (userId && roomId && showtimeId && seatsToRelease.length) {
          for (const seatId of seatsToRelease) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/locks`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId, showtimeId, seatId, userId }),
            });
          }
        }
        setLockedSeats([]);
        setSessionExpiresAt(null);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionExpiresAt, userId, roomId, showtimeId]);

  useEffect(() => {
    return () => {
      const seatsToRelease = lockedSeatsRef.current;
      if (userId && roomId && showtimeId && seatsToRelease.length) {
        for (const seatId of seatsToRelease) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/locks`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, showtimeId, seatId, userId }),
          });
        }
      }
    };
  }, [userId, roomId, showtimeId]);

  const lockSeat = useCallback(
    async (input: LockInput): Promise<boolean> => {
      if (!userId) return false;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/locks`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...input, userId }),
          },
        );

        if (!response.ok) {
          if (response.status === 409) return false;
          throw new Error("Failed to lock seat");
        }

        const data = await response.json();

        if (!sessionExpiresAt) {
          setSessionExpiresAt(data.expiresAt);
        }

        setLockedSeats((prev) => [...prev, input.seatId]);

        return true;
      } catch {
        return false;
      }
    },
    [userId, sessionExpiresAt],
  );

  const unlockSeat = useCallback(
    async (input: LockInput) => {
      if (!userId) return;

      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/locks`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, userId }),
        });
      } finally {
        setLockedSeats((prev) => prev.filter((s) => s !== input.seatId));
        if (lockedSeats.length <= 1) {
          setSessionExpiresAt(null);
        }
      }
    },
    [userId, lockedSeats.length],
  );

  const unlockAll = useCallback(async () => {
    if (!userId || !roomId || !showtimeId) return;

    for (const seatId of lockedSeats) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/locks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, showtimeId, seatId, userId }),
      });
    }

    setLockedSeats([]);
    setSessionExpiresAt(null);
  }, [userId, roomId, showtimeId, lockedSeats]);

  const isLocked = useCallback(
    (seatId: string) => lockedSeats.includes(seatId),
    [lockedSeats],
  );

  const getRemainingTime = useCallback(() => {
    if (!sessionExpiresAt) return "0:00";
    const totalSeconds = Math.max(
      0,
      Math.floor((sessionExpiresAt - Date.now()) / 1000),
    );
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [sessionExpiresAt]);

  return {
    lockedSeats,
    sessionExpiresAt,
    lockSeat,
    unlockSeat,
    unlockAll,
    isLocked,
    getRemainingTime,
  };
}
