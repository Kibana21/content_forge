"use client";
import { Button } from "@/components/ui/Button";
import type { ExportVersion } from "@/lib/api/versions";

export type ExportFormat = "full_package" | "script_only" | "json";

export const EXPORT_FORMATS: { key: ExportFormat; icon: string; title: string; desc: string }[] = [
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

export function ExportViewerModal({
  ev,
  onClose,
  onDownload,
}: {
  ev: ExportVersion;
  onClose: () => void;
  onDownload: () => void;
}) {
  const data = JSON.parse(ev.export_json);
  const formatLabel = EXPORT_FORMATS.find((f) => f.key === ev.format)?.title || ev.format;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--surface)", borderRadius: "var(--radius-lg)",
          width: "100%", maxWidth: 780, maxHeight: "85vh",
          display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{formatLabel} — v{ev.version_number}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              {new Date(ev.created_at).toLocaleString()}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 22, cursor: "pointer",
            color: "var(--text-secondary)", lineHeight: 1,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {ev.format === "json" && (
            <pre style={{
              margin: 0, background: "#1a1a2e", color: "#e2e8f0", borderRadius: 8,
              padding: "16px 20px", fontSize: 12.5, lineHeight: 1.6, overflowX: "auto",
              fontFamily: "'Menlo', 'Monaco', 'Consolas', monospace", whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          )}

          {ev.format === "script_only" && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px" }}>{data.title}</h2>
              {(data.scenes || []).map((s: { scene: number; name: string; dialogue: string }) => (
                <div key={s.scene} style={{ marginBottom: 24 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: 6,
                  }}>
                    Scene {s.scene} — {s.name}
                  </div>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: "var(--text)" }}>
                    {s.dialogue}
                  </p>
                </div>
              ))}
            </div>
          )}

          {ev.format === "full_package" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>{data.title}</h2>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 16 }}>
                  {data.presenter && <span>👤 {data.presenter}</span>}
                  {data.brand_kit && <span>🎨 {data.brand_kit}</span>}
                </div>
              </div>
              {(data.scenes || []).map((s: {
                scene: number; name: string; time: string;
                dialogue: string; setting: string; camera: string; prompt: string;
              }) => (
                <div key={s.scene} style={{
                  border: "1px solid var(--border)", borderRadius: "var(--radius)",
                  padding: "16px 18px", marginBottom: 14,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "var(--primary)", color: "#fff",
                      fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {s.scene}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-secondary)" }}>{s.time}</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-secondary)", marginBottom: 4 }}>Dialogue</div>
                      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>{s.dialogue}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-secondary)", marginBottom: 4 }}>Setting</div>
                      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6 }}>{s.setting}</p>
                    </div>
                  </div>

                  {s.camera && (
                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, background: "#EFF6FF", color: "#1D4ED8",
                        padding: "2px 8px", borderRadius: 20,
                      }}>
                        📷 {s.camera}
                      </span>
                    </div>
                  )}

                  {s.prompt && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-secondary)", marginBottom: 4 }}>AI Prompt</div>
                      <p style={{
                        margin: 0, fontSize: 12, lineHeight: 1.55, color: "var(--text-secondary)",
                        background: "var(--bg)", padding: "8px 12px", borderRadius: 6,
                        fontFamily: "'Menlo', monospace",
                      }}>
                        {s.prompt}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0,
        }}>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onDownload}>↓ Download</Button>
        </div>
      </div>
    </div>
  );
}
