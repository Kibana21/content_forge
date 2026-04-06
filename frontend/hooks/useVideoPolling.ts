"use client";
import { useEffect, useState } from "react";
import { videosApi } from "@/lib/api/videos";
import type { Video } from "@/lib/types/video";

export function useVideoPolling(initialVideos: Video[]) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);

  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  useEffect(() => {
    const renderingIds = videos
      .filter((v) => v.status === "queued" || v.status === "rendering")
      .map((v) => v.id);

    if (renderingIds.length === 0) return;

    const interval = setInterval(async () => {
      const updates = await Promise.all(renderingIds.map((id) => videosApi.get(id).catch(() => null)));
      setVideos((prev) =>
        prev.map((v) => {
          const update = updates.find((u) => u?.id === v.id);
          return update || v;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [videos]);

  return { videos, setVideos };
}
