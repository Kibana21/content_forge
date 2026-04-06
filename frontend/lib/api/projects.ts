import apiClient from "./client";
import type { Project, ProjectStats } from "../types/project";

export const projectsApi = {
  list: () => apiClient.get<Project[]>("/projects").then((r) => r.data),
  stats: () => apiClient.get<ProjectStats>("/projects/stats").then((r) => r.data),
  get: (id: string) => apiClient.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (data: Partial<Project>) => apiClient.post<Project>("/projects", data).then((r) => r.data),
  update: (id: string, data: Partial<Project>) =>
    apiClient.patch<Project>(`/projects/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
  export: (id: string, format: "full_package" | "script_only" | "json") =>
    apiClient.post(`/projects/${id}/export`, { format }).then((r) => r.data),
};
