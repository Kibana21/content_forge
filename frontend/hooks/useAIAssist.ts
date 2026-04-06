"use client";
import { useState, useCallback } from "react";

export function useAIAssist<T>(fn: () => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI assist failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, [fn]);

  return { run, loading, error };
}
