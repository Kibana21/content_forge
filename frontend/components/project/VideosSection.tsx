"use client";
import type { Video } from "@/lib/types/video";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatDuration } from "@/lib/utils/duration";

interface VideosSectionProps {
  videos: Video[];
  onGenerateNew: () => void;
}

function VideoCard({ video }: { video: Video }) {
  const isRendering = video.status === "rendering" || video.status === "queued";

  return (
    <div className="video-card">
      <div className="video-thumb">
        {isRendering ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>⏳</div>
            <div style={{ fontSize: 12 }}>Rendering…</div>
          </div>
        ) : (
          <div className="video-play-btn">▶</div>
        )}
        {video.duration_seconds && !isRendering && (
          <span className="video-duration">{formatDuration(video.duration_seconds)}</span>
        )}
      </div>
      <div className="video-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            {video.version_title}
          </span>
          <Badge status={video.status} />
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-tertiary)" }}>
          {new Date(video.created_at).toLocaleDateString()}
        </p>
        {isRendering && (
          <div className="video-progress" style={{ marginTop: 10 }}>
            <ProgressBar percent={video.progress_percent} />
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
              {video.progress_percent}% complete
              {video.current_scene > 0 && ` — Scene ${video.current_scene} rendering`}
            </p>
          </div>
        )}
        {!isRendering && video.status === "ready" && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Button variant="outline" size="sm">Download</Button>
            <Button variant="ghost" size="sm">Share</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function VideosSection({ videos, onGenerateNew }: VideosSectionProps) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Generated Videos</h2>
        <Button size="sm" onClick={onGenerateNew}>+ Generate New</Button>
      </div>
      {videos.length === 0 ? (
        <p style={{ color: "var(--text-tertiary)", fontSize: 14, margin: 0 }}>
          No videos yet. Click &ldquo;Generate Video&rdquo; to create your first one.
        </p>
      ) : (
        <div className="videos-grid">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
