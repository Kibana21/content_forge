"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types/project";
import { Button } from "@/components/ui/Button";
import { useEditorStore } from "@/stores/useEditorStore";
import { projectsApi } from "@/lib/api/projects";
import { wordCount } from "@/lib/utils/wordCount";
import { scenesToDurationLabel } from "@/lib/utils/duration";
import { SPEAKING_STYLE_LABELS } from "@/lib/types/presenter";

type ExportFormat = "full_package" | "script_only" | "json";

const FORMATS: { key: ExportFormat; icon: string; title: string; desc: string }[] = [
  {
    key: "full_package",
    icon: "📦",
    title: "Full Package",
    desc: "Scene-by-scene brief with presenter description and visuals. Ready for your video team or AI tool.",
  },
  {
    key: "script_only",
    icon: "📄",
    title: "Script Only",
    desc: "Clean script document with scene markers. Good for review or voiceover recording.",
  },
  {
    key: "json",
    icon: "💾",
    title: "Technical (JSON)",
    desc: "Structured data file for direct import into AI video generation platforms.",
  },
];

interface StepReviewExportProps {
  project: Project;
  onSaved: (p: Project) => void;
}

export function StepReviewExport({ project, onSaved }: StepReviewExportProps) {
  const router = useRouter();
  const { reset } = useEditorStore();
  const [format, setFormat] = useState<ExportFormat>("full_package");
  const [exporting, setExporting] = useState(false);

  const wc = project.script ? wordCount(project.script) : 0;
  const scenes = project.scenes || [];
  const presenter = project.presenter;

  async function handleExport() {
    setExporting(true);
    try {
      const result = await projectsApi.export(project.id, format);
      const updated = await projectsApi.update(project.id, { status: "exported" });
      onSaved(updated);

      if (format === "json") {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project.title.replace(/\s+/g, "_")}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        console.log("Export:", result);
      }

      reset();
      router.push(`/projects/${project.id}`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="page-content">
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Review & Export</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 28px", fontSize: 15 }}>
          Everything looks good. Choose how you&apos;d like to export your package.
        </p>

        {/* Stats */}
        <div className="stats-row" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-value">{scenes.length}</div>
            <div className="stat-label">Scenes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{scenesToDurationLabel(project.target_duration)}</div>
            <div className="stat-label">Duration</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{wc}</div>
            <div className="stat-label">Words</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: 20, color: "var(--green)" }}>✓</div>
            <div className="stat-label">Consistency</div>
          </div>
        </div>

        {/* Presenter summary */}
        {presenter && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Presenter</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="presenter-avatar-lg">{presenter.name[0]?.toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{presenter.name}</div>
                {presenter.speaking_style && (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {SPEAKING_STYLE_LABELS[presenter.speaking_style]}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "var(--primary)", marginTop: 4 }}>
                  🔒 Appearance locked across all {scenes.length} scenes
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scene list */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Scenes</div>
          <div className="scene-timeline">
            {scenes.map((scene) => (
              <div key={scene.id} className="scene-row">
                <div className="scene-num">{scene.sequence_number}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{scene.name}</div>
                  {scene.setting && (
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                      {scene.setting.slice(0, 80)}{scene.setting.length > 80 ? "…" : ""}
                    </div>
                  )}
                </div>
                {scene.time_start != null && scene.time_end != null && (
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                    {scene.time_start}s – {scene.time_end}s
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Export format */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Export Format</div>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)" }}>
            Choose how you&apos;d like to export your package.
          </p>
          <div className="export-grid">
            {FORMATS.map((f) => (
              <div
                key={f.key}
                className={`export-card${format === f.key ? " selected" : ""}`}
                onClick={() => setFormat(f.key)}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="step-footer">
        <Button variant="ghost" onClick={() => useEditorStore.getState().goToStep(4)}>← Back</Button>
        <Button size="lg" loading={exporting} onClick={handleExport}>
          Export Package
        </Button>
      </div>
    </div>
  );
}
