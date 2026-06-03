import { useEffect, useState } from "react";

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("userId");

    if (stored) {
      setUserId(stored);
    } else {
      const newId = crypto.randomUUID();
      localStorage.setItem("userId", newId);
      setUserId(newId);
    }
  }, []);

  return userId;
}
