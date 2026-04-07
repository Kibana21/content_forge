"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types/project";
import { Button } from "@/components/ui/Button";
import { useEditorStore } from "@/stores/useEditorStore";
import { projectsApi } from "@/lib/api/projects";
import { versionsApi, type ExportVersion } from "@/lib/api/versions";
import { wordCount } from "@/lib/utils/wordCount";
import { scenesToDurationLabel } from "@/lib/utils/duration";
import { SPEAKING_STYLE_LABELS } from "@/lib/types/presenter";
import { ExportViewerModal, EXPORT_FORMATS, type ExportFormat } from "@/components/ui/ExportViewerModal";

const FORMATS = EXPORT_FORMATS;

interface StepReviewExportProps {
  project: Project;
  onSaved: (p: Project) => void;
}

export function StepReviewExport({ project, onSaved }: StepReviewExportProps) {
  const router = useRouter();
  const { reset } = useEditorStore();
  const [format, setFormat] = useState<ExportFormat>("full_package");
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingExport, setViewingExport] = useState<ExportVersion | null>(null);

  const wc = project.script ? wordCount(project.script) : 0;
  const scenes = project.scenes || [];
  const presenter = project.presenter;

  useEffect(() => {
    versionsApi.listExports(project.id).then(setExportHistory).catch(() => {});
  }, [project.id]);

  async function handleExport() {
    setExporting(true);
    try {
      await projectsApi.export(project.id, format);
      const updated = await projectsApi.update(project.id, { status: "exported" });
      onSaved(updated);

      // Refresh export history and open the newest version in the viewer
      const history = await versionsApi.listExports(project.id);
      setExportHistory(history);
      if (history.length > 0) {
        setShowHistory(true);
        setViewingExport(history[0]); // newest first
      }
    } finally {
      setExporting(false);
    }
  }

  function downloadVersion(ev: ExportVersion) {
    const data = JSON.parse(ev.export_json);
    const ext = ev.format === "script_only" ? "txt" : "json";
    const content = ev.format === "script_only"
      ? (data.scenes || []).map((s: { scene: number; name: string; dialogue: string }) =>
          `Scene ${s.scene} — ${s.name}\n\n${s.dialogue}`
        ).join("\n\n---\n\n")
      : JSON.stringify(data, null, 2);
    const mimeType = ev.format === "script_only" ? "text/plain" : "application/json";
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, "_")}_v${ev.version_number}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {viewingExport && (
        <ExportViewerModal
          ev={viewingExport}
          onClose={() => setViewingExport(null)}
          onDownload={() => downloadVersion(viewingExport)}
        />
      )}
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
        <div className="card" style={{ marginBottom: 16 }}>
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

        {/* Export history */}
        {exportHistory.length > 0 && (
          <div className="card">
            <div
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => setShowHistory((v) => !v)}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Export history</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {exportHistory.length} previous export{exportHistory.length > 1 ? "s" : ""}
                </div>
              </div>
              <span style={{ fontSize: 18, color: "var(--text-tertiary)", userSelect: "none" }}>
                {showHistory ? "▲" : "▼"}
              </span>
            </div>

            {showHistory && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {exportHistory.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      border: "1px solid var(--border)", borderRadius: "var(--radius)",
                      padding: "10px 14px", display: "flex", alignItems: "center",
                      justifyContent: "space-between", gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, background: "var(--primary-light)",
                          color: "var(--primary)", padding: "2px 7px", borderRadius: 20,
                        }}>
                          v{ev.version_number}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {FORMATS.find((f) => f.key === ev.format)?.title || ev.format}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {new Date(ev.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button variant="outline" size="sm" onClick={() => setViewingExport(ev)}>
                        View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => downloadVersion(ev)}>
                        ↓ Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="step-footer">
        <Button variant="ghost" onClick={() => useEditorStore.getState().goToStep(4)}>← Back</Button>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="outline" onClick={() => { reset(); router.push(`/projects/${project.id}`); }}>
            Go to Project
          </Button>
          <Button size="lg" loading={exporting} onClick={handleExport}>
            Export Package
          </Button>
        </div>
      </div>
    </div>
  );
}
