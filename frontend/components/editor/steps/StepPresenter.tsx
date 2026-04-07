"use client";
import { useState, useEffect, useCallback } from "react";
import type { Project } from "@/lib/types/project";
import type { Presenter } from "@/lib/types/presenter";
import { SPEAKING_STYLE_LABELS, AGE_RANGES } from "@/lib/types/presenter";
import { StepFooter } from "@/components/editor/StepFooter";
import { Button } from "@/components/ui/Button";
import { useEditorStore } from "@/stores/useEditorStore";
import { usePresenterStore } from "@/stores/usePresenterStore";
import { presentersApi } from "@/lib/api/presenters";
import { projectsApi } from "@/lib/api/projects";
import { aiApi } from "@/lib/api/ai";
import { useAIAssist } from "@/hooks/useAIAssist";

interface StepPresenterProps {
  project: Project;
  onSaved: (p: Project) => void;
}

const PRESET_STYLES = Object.keys(SPEAKING_STYLE_LABELS) as (keyof typeof SPEAKING_STYLE_LABELS)[];

function parseStyles(raw: string | null | undefined): { selected: string[]; custom: string } {
  if (!raw) return { selected: [], custom: "" };
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const selected = parts.filter((p) => PRESET_STYLES.includes(p as any));
  const custom = parts.filter((p) => !PRESET_STYLES.includes(p as any)).join(", ");
  return { selected, custom };
}

const EMPTY: Partial<Presenter> = {
  name: "", age_range: "Early 30s", appearance_keywords: "", speaking_style: undefined, full_appearance: "",
};

export function StepPresenter({ project, onSaved }: StepPresenterProps) {
  const { markStepComplete, goToStep } = useEditorStore();
  const { presenters, fetch: fetchPresenters, add: addPresenter } = usePresenterStore();
  const [form, setForm] = useState<Partial<Presenter>>({ ...EMPTY, ...project.presenter });
  const [saving, setSaving] = useState(false);

  const { selected: selectedStyles, custom: customStyle } = parseStyles(form.speaking_style);
  const [customStyleInput, setCustomStyleInput] = useState(customStyle);

  function toggleStyle(value: string) {
    const next = selectedStyles.includes(value)
      ? selectedStyles.filter((s) => s !== value)
      : [...selectedStyles, value];
    const combined = [...next, ...(customStyleInput.trim() ? [customStyleInput.trim()] : [])].join(", ");
    setForm((f) => ({ ...f, speaking_style: combined as any }));
  }

  function commitCustomStyle(value: string) {
    setCustomStyleInput(value);
    const combined = [...selectedStyles, ...(value.trim() ? [value.trim()] : [])].join(", ");
    setForm((f) => ({ ...f, speaking_style: combined as any }));
  }

  useEffect(() => { fetchPresenters(); }, []);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const generateAppearance = useCallback(
    () => aiApi.generateAppearance(form.appearance_keywords || ""),
    [form.appearance_keywords]
  );
  const { run: runGenerateAppearance, loading: genLoading } = useAIAssist(generateAppearance);

  async function handleGenerate() {
    const result = await runGenerateAppearance();
    if (result) set("full_appearance", result);
  }

  async function handleContinue() {
    setSaving(true);
    try {
      let presenter: Presenter;
      if (form.id) {
        presenter = await presentersApi.update(form.id, form);
      } else {
        presenter = await presentersApi.create(form as Omit<Presenter, "id" | "user_id" | "created_at" | "updated_at">);
        addPresenter(presenter);
      }
      const updated = await projectsApi.update(project.id, { presenter_id: presenter.id });
      onSaved(updated);
      markStepComplete(2);
      goToStep(3);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-content">
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Who is presenting?</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 28px", fontSize: 15 }}>
          Define the on-screen person. Their appearance will stay consistent across every scene automatically.
        </p>

        {/* Saved presenters */}
        {presenters.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--text-secondary)" }}>
              Use a saved presenter
            </div>
            <div className="pill-group">
              <button className={`pill${!form.id ? " selected" : ""}`} onClick={() => setForm({ ...EMPTY })}>
                + Create New
              </button>
              {presenters.map((p) => (
                <button key={p.id} className={`pill${form.id === p.id ? " selected" : ""}`} onClick={() => setForm(p)}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name / Role</label>
                <input className="form-control" value={form.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Maya - Friendly Advisor" />
              </div>
              <div className="form-group">
                <label className="form-label">Age Range</label>
                <select className="form-control" value={form.age_range || ""} onChange={(e) => set("age_range", e.target.value)}>
                  <option value="">Select…</option>
                  {AGE_RANGES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Appearance Keywords
                <span>comma-separated descriptors</span>
              </label>
              <input className="form-control" value={form.appearance_keywords || ""} onChange={(e) => set("appearance_keywords", e.target.value)} placeholder="e.g. warm smile, dark hair in a neat bun, navy blazer, pearl earrings" />
              <p className="form-hint">Describe the look you want. The more specific, the more consistent.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Speaking Style <span>select all that apply</span></label>
              <div className="pill-group" style={{ marginBottom: 10 }}>
                {(Object.entries(SPEAKING_STYLE_LABELS) as [string, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    className={`pill${selectedStyles.includes(value) ? " selected" : ""}`}
                    onClick={() => toggleStyle(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                className="form-control"
                value={customStyleInput}
                onChange={(e) => setCustomStyleInput(e.target.value)}
                onBlur={(e) => commitCustomStyle(e.target.value)}
                placeholder="Or describe your own style… e.g. storytelling, gently humorous"
              />
            </div>
          </div>
        </div>

        {/* Full appearance card */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Full Appearance Description</div>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
                This description is injected into every scene to keep the presenter looking identical.
              </p>
            </div>
            <Button variant="ai" size="sm" loading={genLoading} onClick={handleGenerate}>
              ✨ Generate from keywords
            </Button>
          </div>
          <textarea className="form-control" rows={5} value={form.full_appearance || ""} onChange={(e) => set("full_appearance", e.target.value)} placeholder="A vivid, detailed description of how this presenter looks…" />
        </div>

        <div className="explainer-card">
          💡 AI video tools generate each scene independently. Without repeating the presenter&apos;s appearance in every scene, the person may look completely different from one clip to the next. This description acts as the &ldquo;lock&rdquo; that keeps {form.name || "the presenter"} looking consistent throughout your video.
        </div>
      </div>

      <StepFooter projectId={project.id} continueLabel="Continue to Script →" onContinue={handleContinue} loading={saving} />
    </div>
  );
}
