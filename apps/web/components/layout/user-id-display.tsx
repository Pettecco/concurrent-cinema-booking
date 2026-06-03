"use client";

import { useUserId } from "@/hooks/use-user-id";

export function UserIdDisplay() {
  const userId = useUserId();

  if (!userId) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 rounded px-6 py-3 text-base font-semibold text-white shadow-lg">
      <span className="text-muted font-bold">userId:</span>{" "}
      <span className="font-mono text-carrow-orange">{userId}</span>
    </div>
  );
}
