import { useCallback, useEffect, useRef, useState } from "react";

type FetchStatus = "idle" | "loading" | "success" | "error";

interface UseFetchOptions<T> {
  enabled?: boolean;
  initialData?: T;
  fetchOptions?: RequestInit;
}

interface UseFetchReturn<T> {
  data: T | null;
  error: Error | null;
  status: FetchStatus;
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
  const [status, setStatus] = useState<FetchStatus>("idle");

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!url) return;

    const requestId = ++requestIdRef.current;

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
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

      if (mountedRef.current && requestId === requestIdRef.current) {
        setData(json);
        setStatus("success");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      if (mountedRef.current && requestId === requestIdRef.current) {
        setError(
          err instanceof Error ? err : new Error("An unknown error occurred"),
        );
        setStatus("error");
      }
    }
  }, [url, fetchOptions]);

  useEffect(() => {
    if (!enabled || !url) return;

    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        fetchData();
      }
    });

    return () => {
      isMounted = false;
      abortRef.current?.abort();
    };
  }, [enabled, url, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    status,
    loading: status === "loading",
    refetch,
  };
}
