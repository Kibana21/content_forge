"use client";
import { useState } from "react";
import type { Video } from "@/lib/types/video";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatDuration } from "@/lib/utils/duration";
import { videosApi } from "@/lib/api/videos";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function VideoPlayerModal({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  const streamUrl = `${API_URL}/videos/${video.id}/stream`;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.85)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "100%", maxWidth: 900,
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{video.version_title}</div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
              width: 36, height: 36, cursor: "pointer", color: "#fff",
              fontSize: 20, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Video player */}
        <video
          src={streamUrl}
          controls
          autoPlay
          style={{
            width: "100%", borderRadius: 10,
            background: "#000", maxHeight: "75vh",
          }}
        />

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <a href={streamUrl} download={`${video.version_title}.mp4`}>
            <button style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
            }}>
              ↓ Download
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

interface VideosSectionProps {
  videos: Video[];
  onGenerateNew: () => void;
  onDeleted: (videoId: string) => void;
}

function VideoCard({ video, onDeleted }: { video: Video; onDeleted: (id: string) => void }) {
  const isRendering = video.status === "rendering" || video.status === "queued";
  const isFailed = video.status === "failed";
  const isReady = video.status === "ready";
  const streamUrl = `${API_URL}/videos/${video.id}/stream`;
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [playing, setPlaying] = useState(false);

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    try {
      await videosApi.delete(video.id);
      onDeleted(video.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {playing && <VideoPlayerModal video={video} onClose={() => setPlaying(false)} />}
      <div className="video-card">
      <div
        className="video-thumb"
        onClick={() => isReady && setPlaying(true)}
        style={isReady ? { cursor: "pointer" } : undefined}
      >
        {isFailed ? (
          <div style={{ textAlign: "center", color: "rgba(255,100,100,0.8)" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>✕</div>
            <div style={{ fontSize: 12 }}>Failed</div>
          </div>
        ) : isRendering ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>⏳</div>
            <div style={{ fontSize: 12 }}>
              {video.status === "queued" ? "Queued…" : "Rendering…"}
            </div>
          </div>
        ) : (
          <div className="video-play-btn" style={{ transform: "scale(1.1)" }}>▶</div>
        )}
        {video.duration_seconds && isReady && (
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

        {isFailed && video.error_message && (
          <p style={{
            margin: "8px 0 0", fontSize: 12, color: "#dc2626",
            background: "#FEF2F2", padding: "6px 10px", borderRadius: 6, lineHeight: 1.4,
          }}>
            {video.error_message}
          </p>
        )}

        {isReady && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <a href={streamUrl} download={`${video.version_title}.mp4`}>
              <Button variant="outline" size="sm">↓ Download</Button>
            </a>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontSize: 12, fontWeight: 600,
              color: deleteConfirm ? "#dc2626" : "var(--text-tertiary)",
            }}
          >
            {deleting ? "Deleting…" : deleteConfirm ? "Confirm delete?" : "🗑 Delete"}
          </button>
          {deleteConfirm && !deleting && (
            <button
              onClick={() => setDeleteConfirm(false)}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: 0,
                fontSize: 12, color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export function VideosSection({ videos, onGenerateNew, onDeleted }: VideosSectionProps) {
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
            <VideoCard key={v.id} video={v} onDeleted={onDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
