export type VideoStatus = "queued" | "rendering" | "ready" | "failed";

export interface Video {
  id: string;
  project_id: string;
  version_title: string;
  status: VideoStatus;
  progress_percent: number;
  current_scene: number;
  duration_seconds: number | null;
  file_url: string | null;
  task_id: string | null;
  created_at: string;
  updated_at: string;
}
