import { useCallback, useEffect, useRef, useState } from "react";

interface UseFetchOptions<T> {
  enabled?: boolean;
  initialData?: T;
  fetchOptions?: RequestInit;
}

interface UseFetchReturn<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useFetch<T = unknown>(
  url: string | null,
  options: UseFetchOptions<T> = {},
): UseFetchReturn<T> {
  const { enabled = true, initialData, fetchOptions } = options;

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${url}`,
        {
          ...fetchOptions,
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = (await response.json()) as T;
      setData(json);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred"),
      );
    } finally {
      setLoading(false);
    }
  }, [url, fetchOptions]);

  useEffect(() => {
    if (!enabled || !url) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    fetchData();

    return () => {
      abortRef.current?.abort();
    };
  }, [enabled, url, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch };
}
