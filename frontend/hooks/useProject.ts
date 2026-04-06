"use client";
import useSWR from "swr";
import { projectsApi } from "@/lib/api/projects";

export function useProject(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/projects/${id}` : null,
    () => projectsApi.get(id!),
    { refreshInterval: 0 }
  );
  return { project: data, error, isLoading, mutate };
}
