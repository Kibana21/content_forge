export type SpeakingStyle =
  | "warm_reassuring"
  | "confident_authoritative"
  | "energetic_motivational"
  | "calm_educational";

export const SPEAKING_STYLE_LABELS: Record<SpeakingStyle, string> = {
  warm_reassuring: "Warm & Reassuring",
  confident_authoritative: "Confident & Authoritative",
  energetic_motivational: "Energetic & Motivational",
  calm_educational: "Calm & Educational",
};

export const AGE_RANGES = ["20s", "Early 30s", "40s", "50s"];

export interface Presenter {
  id: string;
  user_id: string;
  name: string;
  age_range: string | null;
  appearance_keywords: string | null;
  speaking_style: SpeakingStyle | null;
  full_appearance: string | null;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}
