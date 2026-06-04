import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type WebSocketEvent =
  | {
      type: "seat_locked";
      roomId: string;
      seatId: string;
      userId: string;
      expiresAt: string;
    }
  | { type: "seat_released"; roomId: string; seatId: string }
  | { type: "seat_booked"; roomId: string; seatId: string; userId: string }
  | { type: "lock_expired"; roomId: string; seatId: string };

interface UseWebSocketReturn {
  connected: boolean;
  subscribe: (roomId: string) => void;
  unsubscribe: (roomId: string) => void;
  events: WebSocketEvent[];
}

export function useWebSocket(): UseWebSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}`, {
      path: "/ws",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
    });
    socket.on("disconnect", () => {
      setConnected(false);
    });
    socket.on("connect_error", (err) => {
      console.error("WS connect error:", err.message);
    });

    socket.on("seat_locked", (data: WebSocketEvent) => {
      setEvents((prev) => [...prev, data]);
    });
    socket.on("seat_released", (data: WebSocketEvent) => {
      setEvents((prev) => [...prev, data]);
    });
    socket.on("seat_booked", (data: WebSocketEvent) => {
      setEvents((prev) => [...prev, data]);
    });
    socket.on("lock_expired", (data: WebSocketEvent) => {
      setEvents((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribe = useCallback((roomId: string) => {
    socketRef.current?.emit("subscribe", roomId);
  }, []);

  const unsubscribe = useCallback((roomId: string) => {
    socketRef.current?.emit("unsubscribe", roomId);
  }, []);

  return { connected, subscribe, unsubscribe, events };
}
