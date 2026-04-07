"use client";
import { useState, useEffect } from "react";
import type { Project } from "@/lib/types/project";
import { Button } from "@/components/ui/Button";
import { ExportViewerModal, EXPORT_FORMATS, type ExportFormat } from "@/components/ui/ExportViewerModal";
import { projectsApi } from "@/lib/api/projects";
import { versionsApi, type ExportVersion } from "@/lib/api/versions";

interface ExportSectionProps {
  project: Project;
  onSaved: (p: Project) => void;
}

export function ExportSection({ project, onSaved }: ExportSectionProps) {
  const [format, setFormat] = useState<ExportFormat>("full_package");
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingExport, setViewingExport] = useState<ExportVersion | null>(null);

  useEffect(() => {
    versionsApi.listExports(project.id).then(setExportHistory).catch(() => {});
  }, [project.id]);

  async function handleExport() {
    setExporting(true);
    try {
      await projectsApi.export(project.id, format);
      const updated = await projectsApi.update(project.id, { status: "exported" });
      onSaved(updated);

      const history = await versionsApi.listExports(project.id);
      setExportHistory(history);
      if (history.length > 0) {
        setShowHistory(true);
        setViewingExport(history[0]);
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
    <div className="card" style={{ marginBottom: 24 }}>
      {viewingExport && (
        <ExportViewerModal
          ev={viewingExport}
          onClose={() => setViewingExport(null)}
          onDownload={() => downloadVersion(viewingExport)}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Export</div>
        {exportHistory.length > 0 && (
          <button
            onClick={() => setShowHistory((v) => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "var(--primary)", fontWeight: 600, padding: 0,
            }}
          >
            {showHistory ? "Hide history" : `${exportHistory.length} previous export${exportHistory.length > 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      {/* Format picker */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {EXPORT_FORMATS.map((f) => (
          <div
            key={f.key}
            onClick={() => setFormat(f.key)}
            style={{
              border: `2px solid ${format === f.key ? "var(--primary)" : "var(--border)"}`,
              borderRadius: "var(--radius)",
              padding: "12px 14px",
              cursor: "pointer",
              background: format === f.key ? "var(--primary-light)" : "var(--surface)",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{f.title}</div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      <Button loading={exporting} onClick={handleExport}>
        Export Package
      </Button>

      {/* Export history */}
      {showHistory && exportHistory.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 4 }} />
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
                    {EXPORT_FORMATS.find((f) => f.key === ev.format)?.title || ev.format}
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
  );
}
