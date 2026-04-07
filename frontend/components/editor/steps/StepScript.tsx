"use client";
import { useState, useEffect } from "react";
import type { Project } from "@/lib/types/project";
import { StepFooter } from "@/components/editor/StepFooter";
import { Button } from "@/components/ui/Button";
import { useEditorStore } from "@/stores/useEditorStore";
import { projectsApi } from "@/lib/api/projects";
import { aiApi } from "@/lib/api/ai";
import { versionsApi, type ScriptVersion } from "@/lib/api/versions";
import { wordCount, estimatedDuration } from "@/lib/utils/wordCount";

const TONE_CHIPS = [
  { key: "warm_personal", label: "Warm & Personal" },
  { key: "more_professional", label: "More Professional" },
  { key: "shorter", label: "Shorter" },
  { key: "stronger_cta", label: "Stronger CTA" },
];

interface StepScriptProps {
  project: Project;
  onSaved: (p: Project) => void;
}

const TONE_LABELS: Record<string, string> = {
  warm_personal: "Warm & Personal",
  more_professional: "More Professional",
  shorter: "Shorter",
  stronger_cta: "Stronger CTA",
};

function formatTone(tone: string | null): string[] {
  if (!tone) return [];
  return tone.split(",").map((t) => TONE_LABELS[t.trim()] || t.trim()).filter(Boolean);
}

function ScriptVersionModal({ version, onClose, onRestore }: {
  version: ScriptVersion;
  onClose: () => void;
  onRestore: (script: string) => Promise<void>;
}) {
  const toneLabels = formatTone(version.tone);
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--surface)", borderRadius: "var(--radius-lg)",
        width: "100%", maxWidth: 680, maxHeight: "85vh",
        display: "flex", flexDirection: "column",
        boxShadow: "var(--shadow-lg)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, background: "var(--primary-light)",
                  color: "var(--primary)", padding: "2px 8px", borderRadius: 20,
                }}>
                  v{version.version_number}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{version.label || "Script version"}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 14, flexWrap: "wrap" }}>
                <span>{new Date(version.created_at).toLocaleString()}</span>
                {version.word_count && <span>{version.word_count} words</span>}
              </div>
              {toneLabels.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", marginRight: 2 }}>Style:</span>
                  {toneLabels.map((t) => (
                    <span key={t} style={{
                      fontSize: 11, fontWeight: 600, background: "var(--primary-light)",
                      color: "var(--primary)", padding: "2px 8px", borderRadius: 20,
                    }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-tertiary)", lineHeight: 1, flexShrink: 0 }}
            >×</button>
          </div>
        </div>

        {/* Script content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <pre style={{
            margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word",
            fontSize: 14, lineHeight: 1.7, color: "var(--text)",
            fontFamily: "inherit",
          }}>
            {version.script}
          </pre>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
            Restoring will replace your current script — you can undo by restoring another version.
          </p>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button onClick={async () => { await onRestore(version.script); onClose(); }}>
              Restore this version
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepScript({ project, onSaved }: StepScriptProps) {
  const { markStepComplete, goToStep } = useEditorStore();
  const [script, setScript] = useState(project.script || "");
  const [saving, setSaving] = useState(false);
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [customTone, setCustomTone] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<ScriptVersion | null>(null);

  useEffect(() => { setScript(project.script || ""); }, [project.id]);

  const hasScript = script.trim().length > 0;
  const hasAnyTone = activeChips.length > 0 || customTone.trim().length > 0;
  const toneString = [...activeChips, ...(customTone.trim() ? [customTone.trim()] : [])].join(",");

  function toggleChip(key: string) {
    setActiveChips((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function loadVersions() {
    setVersionsLoading(true);
    try {
      const v = await versionsApi.listScriptVersions(project.id);
      setVersions(v);
    } finally {
      setVersionsLoading(false);
    }
  }

  async function toggleVersions() {
    if (!showVersions && versions.length === 0) await loadVersions();
    setShowVersions((v) => !v);
  }

  async function handleDraft() {
    setDraftLoading(true);
    try {
      const result = await aiApi.draftScript({
        project_id: project.id,
        video_type: project.video_type || undefined,
        target_audience: project.target_audience || undefined,
        key_message: project.key_message || undefined,
        brand_kit: project.brand_kit || undefined,
        target_duration: project.target_duration || undefined,
        call_to_action: project.call_to_action || undefined,
        tone: toneString || undefined,
      });
      if (result) {
        setScript(result);
        if (showVersions) await loadVersions();
      }
    } finally {
      setDraftLoading(false);
    }
  }

  async function handleRewrite() {
    if (!hasAnyTone || !hasScript) return;
    setRewriteLoading(true);
    try {
      const result = await aiApi.rewriteScript(script, toneString, project.id);
      if (result) {
        setScript(result);
        if (showVersions) await loadVersions();
      }
    } finally {
      setRewriteLoading(false);
    }
  }

  async function handleContinue() {
    setSaving(true);
    try {
      const updated = await projectsApi.update(project.id, {
        script,
        word_count: wordCount(script),
        tone: toneString || project.tone || undefined,
      });
      onSaved(updated);
      markStepComplete(3);
      goToStep(4);
    } finally {
      setSaving(false);
    }
  }

  const wc = wordCount(script);
  const dur = script ? estimatedDuration(script) : null;
  const presenterName = project.presenter?.name?.split(" - ")[0] || "the presenter";

  return (
    <div>
      {viewingVersion && (
        <ScriptVersionModal
          version={viewingVersion}
          onClose={() => setViewingVersion(null)}
          onRestore={async (s) => {
            setScript(s);
            const updated = await projectsApi.update(project.id, {
              script: s,
              word_count: wordCount(s),
            });
            onSaved(updated);
          }}
        />
      )}
      <div className="page-content">
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Write the script</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: 15 }}>
          What will {presenterName} say? Set your style preferences first, then generate or write the script below.
        </p>

        {/* ── Step 1: Style preferences ── */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{
              background: "var(--primary)", color: "#fff", borderRadius: "50%",
              width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, flexShrink: 0,
            }}>1</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Set your style preferences</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                These apply to both auto-drafting and rewriting — select all that apply
              </div>
            </div>
          </div>
          <div className="tone-chips" style={{ marginBottom: 12 }}>
            {TONE_CHIPS.map((chip) => (
              <button
                key={chip.key}
                className={`tone-chip${activeChips.includes(chip.key) ? " active" : ""}`}
                onClick={() => toggleChip(chip.key)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <input
            className="form-control"
            style={{ fontSize: 13 }}
            value={customTone}
            onChange={(e) => setCustomTone(e.target.value)}
            placeholder="Add your own style… e.g. more empathetic, use rhetorical questions, storytelling"
          />
        </div>

        {/* ── Step 2: Script ── */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{
              background: "var(--primary)", color: "#fff", borderRadius: "50%",
              width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, flexShrink: 0,
            }}>2</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Write or generate the script</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Type directly, or let AI draft from your brief{hasAnyTone ? " with your style preferences" : ""}
              </div>
            </div>
            <Button variant="ai" size="sm" loading={draftLoading} onClick={handleDraft}>
              ✨ {hasScript ? "Re-draft" : "Auto-draft from brief"}
            </Button>
          </div>

          <textarea
            className="form-control"
            rows={14}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Write the script here, or click 'Auto-draft from brief' above…"
          />

          <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 16 }}>
              {wc > 0 && <span>{wc} words</span>}
              {dur && <span>~{dur}</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {hasScript && (
                <Button
                  variant="outline"
                  size="sm"
                  loading={rewriteLoading}
                  onClick={handleRewrite}
                  disabled={!hasAnyTone}
                  title={!hasAnyTone ? "Select at least one style preference above" : undefined}
                >
                  ↺ Rewrite with preferences
                </Button>
              )}
            </div>
          </div>
          {hasScript && !hasAnyTone && (
            <p className="form-hint" style={{ marginTop: 6 }}>
              Select style preferences above to enable rewriting.
            </p>
          )}
        </div>

        {/* ── Version history ── */}
        <div className="card">
          <div
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            onClick={toggleVersions}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Version history</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Auto-saved on every AI draft or rewrite
              </div>
            </div>
            <span style={{ fontSize: 18, color: "var(--text-tertiary)", userSelect: "none" }}>
              {showVersions ? "▲" : "▼"}
            </span>
          </div>

          {showVersions && (
            <div style={{ marginTop: 16 }}>
              {versionsLoading ? (
                <p style={{ color: "var(--text-tertiary)", fontSize: 13 }}>Loading versions…</p>
              ) : versions.length === 0 ? (
                <p style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
                  No versions yet. Auto-draft or rewrite to create the first one.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {versions.map((v) => {
                    const toneLabels = formatTone(v.tone);
                    return (
                      <div
                        key={v.id}
                        style={{
                          border: "1px solid var(--border)", borderRadius: "var(--radius)",
                          padding: "12px 14px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                              <span style={{
                                fontSize: 11, fontWeight: 700, background: "var(--primary-light)",
                                color: "var(--primary)", padding: "2px 7px", borderRadius: 20, flexShrink: 0,
                              }}>
                                v{v.version_number}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                                {v.label || "Script version"}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 12, marginBottom: toneLabels.length ? 6 : 0 }}>
                              <span>{new Date(v.created_at).toLocaleString()}</span>
                              {v.word_count && <span>{v.word_count} words</span>}
                            </div>
                            {toneLabels.length > 0 && (
                              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                {toneLabels.map((t) => (
                                  <span key={t} style={{
                                    fontSize: 11, background: "var(--primary-light)",
                                    color: "var(--primary)", padding: "1px 7px", borderRadius: 20,
                                  }}>{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingVersion(v)}
                            style={{ flexShrink: 0 }}
                          >
                            View
                          </Button>
                        </div>
                        {/* First line preview */}
                        <p style={{
                          margin: "10px 0 0", fontSize: 12, color: "var(--text-secondary)",
                          fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          borderLeft: "2px solid var(--border)", paddingLeft: 8,
                        }}>
                          {v.script.split("\n").find((l) => l.trim()) || v.script.slice(0, 100)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <StepFooter projectId={project.id} continueLabel="Break into Scenes →" onContinue={handleContinue} loading={saving} />
    </div>
  );
}
