"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/utils/format";

export function useAsync<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const request = useRef(0);
  const reload = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setError("");
    try {
      const result = await loader();
      if (id === request.current) setData(result);
    } catch (reason) {
      if (id === request.current) setError(errorMessage(reason));
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    const timer = setTimeout(() => {
      void reload();
    }, 0);
    return () => {
      clearTimeout(timer);
      request.current += 1;
    };
  }, [reload]);
  return { data, loading, error, reload, setData };
}
