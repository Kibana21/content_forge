import apiClient from "./client";

export interface ScriptVersion {
  id: string;
  project_id: string;
  version_number: number;
  script: string;
  word_count: number | null;
  tone: string | null;
  label: string | null;
  created_at: string;
}

export interface ExportVersion {
  id: string;
  project_id: string;
  version_number: number;
  format: string;
  export_json: string;
  created_at: string;
}

export const versionsApi = {
  listScriptVersions: (projectId: string) =>
    apiClient.get<ScriptVersion[]>(`/projects/${projectId}/script-versions`).then((r) => r.data),

  listExports: (projectId: string) =>
    apiClient.get<ExportVersion[]>(`/projects/${projectId}/exports`).then((r) => r.data),
};
