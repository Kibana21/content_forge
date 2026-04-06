"use client";
import { useState, useEffect } from "react";
import type { Project } from "@/lib/types/project";
import { VIDEO_TYPE_LABELS, BRAND_KITS, TARGET_DURATIONS } from "@/lib/types/project";
import { StepFooter } from "@/components/editor/StepFooter";
import { projectsApi } from "@/lib/api/projects";
import { useEditorStore } from "@/stores/useEditorStore";

interface StepBriefProps {
  project: Project;
  onSaved: (p: Project) => void;
}

export function StepBrief({ project, onSaved }: StepBriefProps) {
  const { markStepComplete, goToStep } = useEditorStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: project.title || "",
    video_type: project.video_type || "",
    target_audience: project.target_audience || "",
    target_duration: project.target_duration || 60,
    key_message: project.key_message || "",
    brand_kit: project.brand_kit || "",
    call_to_action: project.call_to_action || "",
  });

  useEffect(() => {
    setForm({
      title: project.title || "",
      video_type: project.video_type || "",
      target_audience: project.target_audience || "",
      target_duration: project.target_duration || 60,
      key_message: project.key_message || "",
      brand_kit: project.brand_kit || "",
      call_to_action: project.call_to_action || "",
    });
  }, [project.id]);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function handleContinue() {
    setSaving(true);
    try {
      const updated = await projectsApi.update(project.id, {
        ...form,
        video_type: form.video_type as import("@/lib/types/project").VideoType | undefined,
      });
      onSaved(updated);
      markStepComplete(1);
      goToStep(2);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-content">
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>What are we creating?</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 28px", fontSize: 15 }}>
          Tell us about your video so we can help you build it faster.
        </p>

        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Video Title</label>
              <input className="form-control" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Life Insurance Explainer for New Parents" />
            </div>

            <div className="form-group">
              <label className="form-label">Video Type</label>
              <div className="pill-group">
                {(Object.entries(VIDEO_TYPE_LABELS) as [string, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    className={`pill${form.video_type === value ? " selected" : ""}`}
                    onClick={() => set("video_type", value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <input className="form-control" value={form.target_audience} onChange={(e) => set("target_audience", e.target.value)} placeholder="e.g. First-time homebuyers aged 28–40" />
              </div>
              <div className="form-group">
                <label className="form-label">Target Duration</label>
                <select className="form-control" value={form.target_duration} onChange={(e) => set("target_duration", Number(e.target.value))}>
                  {TARGET_DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Key Message</label>
              <textarea className="form-control" rows={3} value={form.key_message} onChange={(e) => set("key_message", e.target.value)} placeholder="What is the single most important takeaway for the viewer?" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Brand / Compliance Kit</label>
                <select className="form-control" value={form.brand_kit} onChange={(e) => set("brand_kit", e.target.value)}>
                  <option value="">Select a brand kit…</option>
                  {BRAND_KITS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Call to Action</label>
                <input className="form-control" value={form.call_to_action} onChange={(e) => set("call_to_action", e.target.value)} placeholder="e.g. Talk to an advisor today" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <StepFooter projectId={project.id} continueLabel="Continue to Presenter →" onContinue={handleContinue} loading={saving} />
    </div>
  );
}
