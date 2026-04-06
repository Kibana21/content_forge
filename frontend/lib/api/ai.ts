import apiClient from "./client";

export const aiApi = {
  generateAppearance: (keywords: string) =>
    apiClient
      .post<{ full_appearance: string }>("/ai/generate-appearance", { keywords })
      .then((r) => r.data.full_appearance),

  draftScript: (brief: {
    video_type?: string;
    target_audience?: string;
    key_message?: string;
    brand_kit?: string;
    target_duration?: number;
    call_to_action?: string;
  }) =>
    apiClient.post<{ script: string }>("/ai/draft-script", brief).then((r) => r.data.script),

  rewriteScript: (script: string, tone: string) =>
    apiClient
      .post<{ script: string }>("/ai/rewrite-script", { script, tone })
      .then((r) => r.data.script),

  splitScenes: (script: string, numScenes: number, presenterName?: string) =>
    apiClient
      .post<{ scenes: unknown[] }>("/ai/split-scenes", {
        script,
        num_scenes: numScenes,
        presenter_name: presenterName,
      })
      .then((r) => r.data.scenes),
};
