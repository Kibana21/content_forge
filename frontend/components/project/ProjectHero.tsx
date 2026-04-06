"use client";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types/project";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { scenesToDurationLabel } from "@/lib/utils/duration";
import { videosApi } from "@/lib/api/videos";

interface ProjectHeroProps {
  project: Project;
  onVideoGenerated?: () => void;
}

export function ProjectHero({ project, onVideoGenerated }: ProjectHeroProps) {
  const router = useRouter();

  async function handleGenerate() {
    await videosApi.generate(project.id);
    onVideoGenerated?.();
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 24,
        marginBottom: 32,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1 style={{ margin: "0 0 10px", fontSize: 28, fontWeight: 800, color: "var(--text)" }}>
          {project.title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Badge status={project.status} />
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {scenesToDurationLabel(project.target_duration)}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {project.scenes?.length || 0} scenes
          </span>
          <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
            Created {new Date(project.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="outline" onClick={() => router.push(`/projects/${project.id}/edit`)}>
          Edit Storyline
        </Button>
        <Button onClick={handleGenerate}>Generate Video</Button>
      </div>
    </div>
  );
}
