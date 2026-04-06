"use client";
import { useState, useEffect } from "react";
import type { Project } from "@/lib/types/project";
import type { Scene } from "@/lib/types/scene";
import { StepFooter } from "@/components/editor/StepFooter";
import { ConsistencyBanner } from "@/components/ui/ConsistencyBanner";
import { Button } from "@/components/ui/Button";
import { useEditorStore } from "@/stores/useEditorStore";
import { scenesApi } from "@/lib/api/scenes";

interface SceneCardProps {
  scene: Scene;
  onUpdate: (id: string, data: Partial<Scene>) => void;
}

function SceneCard({ scene, onUpdate }: SceneCardProps) {
  return (
    <div className="scene-card">
      <div className="scene-card-thumb">
        <div style={{ textAlign: "center", padding: 16 }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🎬</div>
          <div style={{ fontSize: 11 }}>Storyboard Preview</div>
        </div>
      </div>
      <div className="scene-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              Scene {scene.sequence_number} — {scene.name || "Untitled"}
            </span>
          </div>
          {scene.time_start != null && scene.time_end != null && (
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {scene.time_start}s – {scene.time_end}s
            </span>
          )}
        </div>

        {scene.dialogue && (
          <div className="dialogue-block">&ldquo;{scene.dialogue}&rdquo;</div>
        )}

        <div className="form-group" style={{ marginTop: 10 }}>
          <label className="form-label" style={{ fontSize: 12 }}>Setting</label>
          <textarea
            className="form-control"
            style={{ minHeight: 60, fontSize: 13 }}
            value={scene.setting || ""}
            onChange={(e) => onUpdate(scene.id, { setting: e.target.value })}
            placeholder="Describe the environment and action…"
          />
        </div>

        <div className="scene-tags">
          <span className="scene-tag scene-tag-lock">🔒 Presenter locked</span>
          <span className="scene-tag scene-tag-lock">🎨 Brand locked</span>
          {scene.camera_framing && (
            <span className="scene-tag scene-tag-camera">📷 {scene.camera_framing}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface StepStoryboardProps {
  project: Project;
  onSaved: (p: Project) => void;
}

export function StepStoryboard({ project, onSaved }: StepStoryboardProps) {
  const { markStepComplete, goToStep } = useEditorStore();
  const [scenes, setScenes] = useState<Scene[]>(project.scenes || []);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setScenes(project.scenes || []);
  }, [project.id]);

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

  async function handleContinue() {
    markStepComplete(4);
    goToStep(5);
  }

  const presenterName = project.presenter?.name?.split(" - ")[0] || "Presenter";

  return (
    <div>
      <div className="page-content">
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Storyboard</h1>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 20px", fontSize: 15 }}>
          Your script has been split into {scenes.length} scene{scenes.length !== 1 ? "s" : ""}.
          Edit any scene, or adjust the visuals.
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
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <Button variant="outline" size="sm" loading={generating} onClick={handleGenerate}>
                ↺ Regenerate Scenes
              </Button>
            </div>
            {scenes.map((scene) => (
              <SceneCard key={scene.id} scene={scene} onUpdate={handleSceneUpdate} />
            ))}
          </>
        )}
      </div>

      <StepFooter projectId={project.id} continueLabel="Review & Export →" onContinue={handleContinue} />
    </div>
  );
}
