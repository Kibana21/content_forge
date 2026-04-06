import apiClient from "./client";
import type { Presenter } from "../types/presenter";

export const presentersApi = {
  list: () => apiClient.get<Presenter[]>("/presenters").then((r) => r.data),
  get: (id: string) => apiClient.get<Presenter>(`/presenters/${id}`).then((r) => r.data),
  create: (data: Partial<Presenter>) =>
    apiClient.post<Presenter>("/presenters", data).then((r) => r.data),
  update: (id: string, data: Partial<Presenter>) =>
    apiClient.patch<Presenter>(`/presenters/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/presenters/${id}`),
};
