export interface Scene {
  id: string;
  project_id: string;
  sequence_number: number;
  name: string | null;
  dialogue: string | null;
  setting: string | null;
  camera_framing: string | null;
  time_start: number | null;
  time_end: number | null;
  merged_prompt: string | null;
  storyboard_image_url: string | null;
  created_at: string;
  updated_at: string;
}
