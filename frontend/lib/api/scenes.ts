import apiClient from "./client";
import type { Scene } from "../types/scene";

export const scenesApi = {
  list: (projectId: string) =>
    apiClient.get<Scene[]>(`/projects/${projectId}/scenes`).then((r) => r.data),
  create: (
    projectId: string,
    data: { name?: string; dialogue?: string; setting?: string; camera_framing?: string; insert_after_sequence?: number }
  ) => apiClient.post<Scene[]>(`/projects/${projectId}/scenes`, data).then((r) => r.data),
  generate: (projectId: string) =>
    apiClient.post<Scene[]>(`/projects/${projectId}/scenes/generate`).then((r) => r.data),
  update: (sceneId: string, data: Partial<Scene>) =>
    apiClient.patch<Scene>(`/scenes/${sceneId}`, data).then((r) => r.data),
  delete: (sceneId: string) => apiClient.delete(`/scenes/${sceneId}`),
  reorder: (projectId: string, sceneIds: string[]) =>
    apiClient.post<Scene[]>(`/projects/${projectId}/scenes/reorder`, { scene_ids: sceneIds }).then((r) => r.data),
};
