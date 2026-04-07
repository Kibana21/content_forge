"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types/project";
import { Badge } from "@/components/ui/Badge";
import { VIDEO_TYPE_LABELS } from "@/lib/types/project";
import { scenesToDurationLabel } from "@/lib/utils/duration";
import { projectsApi } from "@/lib/api/projects";

const GRADIENTS: Record<string, string> = {
  product_explainer: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  educational: "linear-gradient(135deg, #0F766E 0%, #06B6D4 100%)",
  agent_training: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  social_ad: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  testimonial: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  corporate_update: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  compliance: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
};

interface ProjectCardProps {
  project: Project;
  onDeleted?: (id: string) => void;
}

export function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const gradient = project.video_type ? GRADIENTS[project.video_type] : GRADIENTS.educational;
  const presenterInitial = project.presenter?.name?.[0]?.toUpperCase() || "?";
  const videoCount = project.videos?.length || 0;

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    try {
      await projectsApi.delete(project.id);
      onDeleted?.(project.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="project-card" onClick={() => !confirming && router.push(`/projects/${project.id}`)}>
      <div className="project-card-thumb" style={{ background: gradient }}>
        {project.video_type && (
          <span className="badge badge-video" style={{ position: "absolute", bottom: 12, left: 12 }}>
            {VIDEO_TYPE_LABELS[project.video_type]}
          </span>
        )}
        {videoCount > 0 && (
          <span className="badge badge-video" style={{ position: "absolute", top: 12, right: 12 }}>
            ▶ {videoCount} video{videoCount > 1 ? "s" : ""}
          </span>
        )}
        {/* Delete button on hover */}
        <button
          onClick={handleDelete}
          title={confirming ? "Click again to confirm" : "Delete project"}
          style={{
            position: "absolute", top: 10, left: 10,
            background: confirming ? "#dc2626" : "rgba(0,0,0,0.5)",
            border: "none", borderRadius: 6, color: "#fff",
            fontSize: 11, fontWeight: 700, padding: "4px 8px",
            cursor: "pointer", opacity: confirming ? 1 : 0,
            transition: "opacity 0.15s",
          }}
          className="project-card-delete"
        >
          {deleting ? "Deleting…" : confirming ? "Confirm delete?" : "🗑 Delete"}
        </button>
      </div>
      <div className="project-card-body">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: "var(--text)" }}>
            {project.title}
          </h3>
          <Badge status={project.status} />
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
          {project.scenes?.length || 0} scene{project.scenes?.length !== 1 ? "s" : ""} ·{" "}
          {scenesToDurationLabel(project.target_duration)}
        </p>
      </div>
      <div className="project-card-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="presenter-avatar">{presenterInitial}</div>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {project.presenter?.name || "No presenter"}
          </span>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          {new Date(project.updated_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
