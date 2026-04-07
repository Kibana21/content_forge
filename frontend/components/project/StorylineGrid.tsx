"use client";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types/project";
import { VIDEO_TYPE_LABELS } from "@/lib/types/project";
import { SPEAKING_STYLE_LABELS } from "@/lib/types/presenter";
import { wordCount, estimatedDuration } from "@/lib/utils/wordCount";

interface StorylineGridProps {
  project: Project;
}

function StorylineCard({
  icon,
  iconBg,
  title,
  summary,
  editLabel,
  onEdit,
  badge,
}: {
  icon: string;
  iconBg: string;
  title: string;
  summary: string;
  editLabel: string;
  onEdit: () => void;
  badge?: string | null;
}) {
  return (
    <div className="storyline-card" onClick={onEdit}>
      <div className="storyline-icon" style={{ background: iconBg }}>
        {icon}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{title}</div>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 700, background: "var(--primary-light)",
            color: "var(--primary)", padding: "1px 7px", borderRadius: 20, whiteSpace: "nowrap",
          }}>
            {badge}
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
        {summary}
      </p>
      <button
        style={{
          marginTop: 12,
          background: "none",
          border: "none",
          color: "var(--primary)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
        }}
      >
        {editLabel} →
      </button>
    </div>
  );
}

export function StorylineGrid({ project }: StorylineGridProps) {
  const router = useRouter();
  const goToStep = (step: number) =>
    router.push(`/projects/${project.id}/edit?step=${step}`);

  const briefSummary = project.video_type
    ? `${VIDEO_TYPE_LABELS[project.video_type]} targeting ${project.target_audience || "general audience"}.${project.brand_kit ? ` Brand kit: ${project.brand_kit}.` : ""}`
    : "No brief configured yet.";

  const presenterSummary = project.presenter
    ? `${project.presenter.name}${project.presenter.age_range ? `, ${project.presenter.age_range}` : ""}.${project.presenter.speaking_style ? ` ${SPEAKING_STYLE_LABELS[project.presenter.speaking_style]} speaking style.` : ""}`
    : "No presenter selected yet.";

  const scriptSummary = project.script
    ? `${wordCount(project.script)} words, ${estimatedDuration(project.script)}. Tone: ${project.tone || "Not set"}.`
    : "No script written yet.";

  const storyboardSummary =
    project.scenes?.length > 0
      ? `${project.scenes.length} scenes across ${project.target_duration || 0}s. Presenter + brand locked on every scene.`
      : "No scenes generated yet.";

  const storyboardVersionNote = project.storyboard_script_version != null
    ? `Generated from script v${project.storyboard_script_version}`
    : null;

  return (
    <div className="storyline-grid">
      <StorylineCard
        icon="📋"
        iconBg="#F0FDFA"
        title="Brief"
        summary={briefSummary}
        editLabel="Edit Brief"
        onEdit={() => goToStep(1)}
      />
      <StorylineCard
        icon="🎭"
        iconBg="#EFF6FF"
        title="Presenter"
        summary={presenterSummary}
        editLabel="Edit Presenter"
        onEdit={() => goToStep(2)}
      />
      <StorylineCard
        icon="✍️"
        iconBg="#FFFBEB"
        title="Script"
        summary={scriptSummary}
        editLabel="Edit Script"
        onEdit={() => goToStep(3)}
      />
      <StorylineCard
        icon="🎬"
        iconBg="#FDF2F8"
        title="Storyboard"
        summary={storyboardSummary}
        editLabel="Edit Storyboard"
        onEdit={() => goToStep(4)}
        badge={storyboardVersionNote}
      />
    </div>
  );
}
