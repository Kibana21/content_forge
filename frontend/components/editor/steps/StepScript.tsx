"use client";
import { useState, useEffect, useCallback } from "react";
import type { Project } from "@/lib/types/project";
import { StepFooter } from "@/components/editor/StepFooter";
import { Button } from "@/components/ui/Button";
import { useEditorStore } from "@/stores/useEditorStore";
import { projectsApi } from "@/lib/api/projects";
import { aiApi } from "@/lib/api/ai";
import { useAIAssist } from "@/hooks/useAIAssist";
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

export function StepScript({ project, onSaved }: StepScriptProps) {
  const { markStepComplete, goToStep } = useEditorStore();
  const [script, setScript] = useState(project.script || "");
  const [saving, setSaving] = useState(false);
  const [activeChip, setActiveChip] = useState<string | null>(null);

  useEffect(() => { setScript(project.script || ""); }, [project.id]);

  const draftFn = useCallback(
    () => aiApi.draftScript({
      video_type: project.video_type || undefined,
      target_audience: project.target_audience || undefined,
      key_message: project.key_message || undefined,
      brand_kit: project.brand_kit || undefined,
      target_duration: project.target_duration || undefined,
      call_to_action: project.call_to_action || undefined,
    }),
    [project]
  );

  const rewriteFn = useCallback(
    () => aiApi.rewriteScript(script, activeChip || "warm_personal"),
    [script, activeChip]
  );

  const { run: runDraft, loading: draftLoading } = useAIAssist(draftFn);
  const { run: runRewrite, loading: rewriteLoading } = useAIAssist(rewriteFn);

  async function handleDraft() {
    const result = await runDraft();
    if (result) setScript(result);
  }

  async function handleToneChip(key: string) {
    setActiveChip(key);
    const fn = () => aiApi.rewriteScript(script, key);
    const result = await new Promise<string | null>((res) => {
      aiApi.rewriteScript(script, key).then(res).catch(() => res(null));
    });
    if (result) setScript(result);
  }

  async function handleContinue() {
    setSaving(true);
    try {
      const updated = await projectsApi.update(project.id, {
        script,
        word_count: wordCount(script),
        tone: activeChip || project.tone || undefined,
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

  return (
    <div>
      <div className="page-content">
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Write the script</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 28px", fontSize: 15 }}>
          Write what {project.presenter?.name?.split(" - ")[0] || "the presenter"} will say, or let AI draft it from your brief.
        </p>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Script</div>
            <Button variant="ai" size="sm" loading={draftLoading} onClick={handleDraft}>
              ✨ Auto-draft from brief
            </Button>
          </div>
          <textarea
            className="form-control"
            rows={14}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Write the script here, or click 'Auto-draft from brief' to generate a first draft…"
          />
          {wc > 0 && (
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 16 }}>
              <span>{wc} words</span>
              {dur && <span>Estimated duration: {dur}</span>}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>
            Adjust tone
          </div>
          <div className="tone-chips">
            {TONE_CHIPS.map((chip) => (
              <button
                key={chip.key}
                className={`tone-chip${activeChip === chip.key ? " active" : ""}`}
                onClick={() => handleToneChip(chip.key)}
                disabled={rewriteLoading || !script}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <p className="form-hint" style={{ marginTop: 8 }}>
            Clicking a chip rewrites your script in that tone. You can edit the result freely.
          </p>
        </div>
      </div>

      <StepFooter projectId={project.id} continueLabel="Break into Scenes →" onContinue={handleContinue} loading={saving} />
    </div>
  );
}
