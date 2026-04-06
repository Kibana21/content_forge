import apiClient from "./client";
import type { Video } from "../types/video";

export const videosApi = {
  list: (projectId: string) =>
    apiClient.get<Video[]>(`/projects/${projectId}/videos`).then((r) => r.data),
  get: (videoId: string) =>
    apiClient.get<Video>(`/videos/${videoId}`).then((r) => r.data),
  generate: (projectId: string, versionTitle?: string) =>
    apiClient
      .post<Video>(`/projects/${projectId}/videos/generate`, { version_title: versionTitle })
      .then((r) => r.data),
  delete: (videoId: string) => apiClient.delete(`/videos/${videoId}`),
};
