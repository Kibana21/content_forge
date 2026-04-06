export type VideoType =
  | "product_explainer"
  | "educational"
  | "agent_training"
  | "social_ad"
  | "testimonial"
  | "corporate_update"
  | "compliance";

export type ProjectStatus = "draft" | "in_review" | "exported";

export const VIDEO_TYPE_LABELS: Record<VideoType, string> = {
  product_explainer: "Product Explainer",
  educational: "Educational / Awareness",
  agent_training: "Agent Training",
  social_ad: "Social Media Ad",
  testimonial: "Customer Testimonial",
  corporate_update: "Corporate Update",
  compliance: "Compliance",
};

export const BRAND_KITS = [
  "SecureLife Standard (Warm, Professional, Blue)",
  "SecureLife Social (Friendly, Casual, Teal)",
  "No brand constraints",
];

export const TARGET_DURATIONS = [
  { value: 15, label: "15 seconds (2–3 scenes)" },
  { value: 30, label: "30 seconds (3–4 scenes)" },
  { value: 60, label: "60 seconds (5 scenes)" },
  { value: 90, label: "90 seconds (6–8 scenes)" },
];

export interface Project {
  id: string;
  user_id: string;
  title: string;
  video_type: VideoType | null;
  target_audience: string | null;
  target_duration: number | null;
  key_message: string | null;
  brand_kit: string | null;
  call_to_action: string | null;
  script: string | null;
  tone: string | null;
  word_count: number | null;
  status: ProjectStatus;
  presenter_id: string | null;
  presenter: import("./presenter").Presenter | null;
  scenes: import("./scene").Scene[];
  videos: import("./video").Video[];
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  total: number;
  drafts: number;
  exported: number;
  in_review: number;
  videos_generated: number;
}
