"use client";
import { useState, useEffect } from "react";
import type { Project } from "@/lib/types/project";
import type { Scene } from "@/lib/types/scene";
import { StepFooter } from "@/components/editor/StepFooter";
import { ConsistencyBanner } from "@/components/ui/ConsistencyBanner";
import { Button } from "@/components/ui/Button";
import { useEditorStore } from "@/stores/useEditorStore";
import { scenesApi } from "@/lib/api/scenes";

const CAMERA_OPTIONS = ["Medium close-up", "Wide shot", "Close-up", "Tracking shot", "Over-the-shoulder"];

// ── Insert Scene Modal ──────────────────────────────────────────────────────

interface InsertModalProps {
  insertAfter: number;
  onConfirm: (data: { name: string; dialogue: string; setting: string; camera_framing: string }) => void;
  onClose: () => void;
}

function InsertModal({ insertAfter, onConfirm, onClose }: InsertModalProps) {
  const [form, setForm] = useState({ name: "", dialogue: "", setting: "", camera_framing: "Medium close-up" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--surface)", borderRadius: "var(--radius-lg)",
          padding: 28, width: "100%", maxWidth: 560,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            Insert scene after Scene {insertAfter}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-tertiary)", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Scene Name</label>
              <input className="form-control" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. The Transition" />
            </div>
            <div className="form-group">
              <label className="form-label">Camera Framing</label>
              <select className="form-control" value={form.camera_framing} onChange={(e) => set("camera_framing", e.target.value)}>
                {CAMERA_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dialogue</label>
            <textarea className="form-control" rows={3} value={form.dialogue} onChange={(e) => set("dialogue", e.target.value)} placeholder="What does the presenter say in this scene?" />
          </div>

          <div className="form-group">
            <label className="form-label">Setting</label>
            <textarea className="form-control" rows={2} value={form.setting} onChange={(e) => set("setting", e.target.value)} placeholder="Describe the environment and presenter's action…" />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(form)}>Insert Scene</Button>
        </div>
      </div>
    </div>
  );
}

// ── Scene Card ──────────────────────────────────────────────────────────────

interface SceneCardProps {
  scene: Scene;
  onUpdate: (id: string, data: Partial<Scene>) => Promise<void>;
  onDelete: (id: string) => void;
}

function SceneCard({ scene, onUpdate, onDelete }: SceneCardProps) {
  const [localDialogue, setLocalDialogue] = useState(scene.dialogue || "");
  const [localSetting, setLocalSetting] = useState(scene.setting || "");
  const [localName, setLocalName] = useState(scene.name || "");
  const [localCamera, setLocalCamera] = useState(scene.camera_framing || "Medium close-up");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalDialogue(scene.dialogue || "");
    setLocalSetting(scene.setting || "");
    setLocalName(scene.name || "");
    setLocalCamera(scene.camera_framing || "Medium close-up");
  }, [scene.id]);

  async function handleSave() {
    setSaving(true);
    await onUpdate(scene.id, {
      name: localName,
      dialogue: localDialogue,
      setting: localSetting,
      camera_framing: localCamera,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="scene-card">
      <div className="scene-card-thumb">
        <div style={{ textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🎬</div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Scene {scene.sequence_number}</div>
        </div>
      </div>

      <div className="scene-card-body">
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
          <input
            className="form-control"
            style={{ fontWeight: 700, fontSize: 14, padding: "6px 10px" }}
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="Scene name…"
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {scene.time_start != null && scene.time_end != null && (
              <span style={{ fontSize: 12, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                {scene.time_start}s – {scene.time_end}s
              </span>
            )}
            <button
              onClick={() => onDelete(scene.id)}
              title="Delete scene"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-tertiary)", fontSize: 16, lineHeight: 1, padding: 4,
              }}
            >
              🗑
            </button>
          </div>
        </div>

        {/* Dialogue */}
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ fontSize: 12 }}>Dialogue <span>what the presenter says</span></label>
          <textarea
            className="form-control"
            style={{ minHeight: 72, fontSize: 13, fontStyle: "italic", borderLeftColor: "var(--primary)", borderLeftWidth: 3 }}
            value={localDialogue}
            onChange={(e) => setLocalDialogue(e.target.value)}
            placeholder="What does the presenter say in this scene?"
          />
        </div>

        {/* Setting */}
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ fontSize: 12 }}>Setting <span>environment & action</span></label>
          <textarea
            className="form-control"
            style={{ minHeight: 56, fontSize: 13 }}
            value={localSetting}
            onChange={(e) => setLocalSetting(e.target.value)}
            placeholder="Describe the environment and presenter's action…"
          />
        </div>

        {/* Camera framing + tags + save */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <select
              className="form-control"
              style={{ width: "auto", fontSize: 12, padding: "4px 8px" }}
              value={localCamera}
              onChange={(e) => setLocalCamera(e.target.value)}
            >
              {CAMERA_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <span className="scene-tag scene-tag-lock">🔒 Presenter locked</span>
            <span className="scene-tag scene-tag-lock">🎨 Brand locked</span>
          </div>
          <Button
            size="sm"
            loading={saving}
            onClick={handleSave}
            style={saved ? { background: "var(--success, #16a34a)", borderColor: "var(--success, #16a34a)" } : {}}
          >
            {saved ? "Saved ✓" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Insert Button between scenes ────────────────────────────────────────────

function InsertButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0", opacity: 0.4 }}
      className="insert-btn-row"
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
    >
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <button
        onClick={onClick}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 12px", borderRadius: 20,
          border: "1.5px dashed var(--primary)", background: "var(--primary-light)",
          color: "var(--primary)", fontSize: 12, fontWeight: 600, cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        + Insert scene here
      </button>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// ── Main StepStoryboard ─────────────────────────────────────────────────────

interface StepStoryboardProps {
  project: Project;
  onSaved: (p: Project) => void;
}

export function StepStoryboard({ project, onSaved }: StepStoryboardProps) {
  const { markStepComplete, goToStep } = useEditorStore();
  const [scenes, setScenes] = useState<Scene[]>(project.scenes || []);
  const [generating, setGenerating] = useState(false);
  const [insertAfter, setInsertAfter] = useState<number | null>(null);
  const [inserting, setInserting] = useState(false);

  useEffect(() => { setScenes(project.scenes || []); }, [project.id]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const generated = await scenesApi.generate(project.id);
      setScenes(generated);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSceneUpdate(id: string, data: Partial<Scene>) {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    await scenesApi.update(id, data);
  }

  async function handleDelete(id: string) {
    setScenes((prev) => prev.filter((s) => s.id !== id));
    await scenesApi.delete(id);
  }

  async function handleInsert(data: { name: string; dialogue: string; setting: string; camera_framing: string }) {
    if (insertAfter === null) return;
    setInserting(true);
    try {
      const updated = await scenesApi.create(project.id, {
        ...data,
        insert_after_sequence: insertAfter,
      });
      setScenes(updated);
      setInsertAfter(null);
    } finally {
      setInserting(false);
    }
  }

  const presenterName = project.presenter?.name?.split(" - ")[0] || "Presenter";

  return (
    <div>
      {insertAfter !== null && (
        <InsertModal
          insertAfter={insertAfter}
          onConfirm={handleInsert}
          onClose={() => setInsertAfter(null)}
        />
      )}

      <div className="page-content">
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Storyboard</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 20px", fontSize: 15 }}>
          {scenes.length > 0
            ? `${scenes.length} scene${scenes.length !== 1 ? "s" : ""}. Edit dialogue, setting, or camera framing directly. Insert new scenes between any two.`
            : "No scenes yet — generate them from your script below."}
        </p>

        {project.presenter && (
          <ConsistencyBanner presenterName={presenterName} brandKit={project.brand_kit} />
        )}

        {scenes.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
              No scenes yet. Click below to split your script into scenes automatically.
            </p>
            <Button loading={generating} onClick={handleGenerate}>
              ✨ Generate Scenes from Script
            </Button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Button variant="outline" size="sm" onClick={() => setInsertAfter(0)}>
                + Add scene at start
              </Button>
              <Button variant="outline" size="sm" loading={generating} onClick={handleGenerate}>
                ↺ Regenerate all scenes
              </Button>
            </div>

            {scenes.map((scene, idx) => (
              <div key={scene.id}>
                <SceneCard scene={scene} onUpdate={handleSceneUpdate} onDelete={handleDelete} />
                <InsertButton onClick={() => setInsertAfter(scene.sequence_number)} />
              </div>
            ))}
          </>
        )}
      </div>

      <StepFooter projectId={project.id} continueLabel="Review & Export →" onContinue={() => { markStepComplete(4); goToStep(5); }} />
    </div>
  );
}
