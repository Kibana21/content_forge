"use client";
import { create } from "zustand";
import type { Project, ProjectStats } from "@/lib/types/project";
import { projectsApi } from "@/lib/api/projects";

interface ProjectStore {
  projects: Project[];
  stats: ProjectStats | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  removeProject: (id: string) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  stats: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const projects = await projectsApi.list();
      set({ projects, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await projectsApi.stats();
      set({ stats });
    } catch {}
  },

  addProject: (project) =>
    set((s) => ({ projects: [project, ...s.projects] })),

  updateProject: (project) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === project.id ? project : p)),
    })),

  removeProject: (id) =>
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
}));
