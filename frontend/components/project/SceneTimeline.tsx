"use client";
import { useRouter } from "next/navigation";
import type { Scene } from "@/lib/types/scene";
import { Button } from "@/components/ui/Button";
import { formatTimeRange } from "@/lib/utils/duration";

interface SceneTimelineProps {
  scenes: Scene[];
  projectId: string;
}

export function SceneTimeline({ scenes, projectId }: SceneTimelineProps) {
  const router = useRouter();

  return (
    <div className="card" style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Scene Timeline</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/projects/${projectId}/edit?step=4`)}
        >
          Open in Editor
        </Button>
      </div>
      {scenes.length === 0 ? (
        <p style={{ color: "var(--text-tertiary)", fontSize: 14, margin: 0 }}>
          No scenes yet — go to the Storyboard step to generate them.
        </p>
      ) : (
        <div className="scene-timeline">
          {scenes.map((scene) => (
            <div key={scene.id} className="scene-row">
              <div className="scene-num">{scene.sequence_number}</div>
              <div className="scene-thumb" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                  {scene.name || `Scene ${scene.sequence_number}`}
                </div>
                {scene.dialogue && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      fontStyle: "italic",
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    &ldquo;{scene.dialogue.slice(0, 80)}{scene.dialogue.length > 80 ? "…" : ""}&rdquo;
                  </div>
                )}
              </div>
              {scene.time_start != null && scene.time_end != null && (
                <span style={{ fontSize: 12, color: "var(--text-tertiary)", flexShrink: 0 }}>
                  {formatTimeRange(scene.time_start, scene.time_end)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
