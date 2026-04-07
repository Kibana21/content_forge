"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ProjectHero } from "@/components/project/ProjectHero";
import { StorylineGrid } from "@/components/project/StorylineGrid";
import { SceneTimeline } from "@/components/project/SceneTimeline";
import { VideosSection } from "@/components/project/VideosSection";
import { ExportSection } from "@/components/project/ExportSection";
import { useProject } from "@/hooks/useProject";
import { useVideoPolling } from "@/hooks/useVideoPolling";
import { videosApi } from "@/lib/api/videos";
import { projectsApi } from "@/lib/api/projects";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { project, mutate } = useProject(id);
  const { videos, setVideos } = useVideoPolling(project?.videos || []);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleGenerateVideo() {
    const video = await videosApi.generate(id);
    setVideos((prev) => [video, ...prev]);
  }

  async function handleDeleteProject() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    try {
      await projectsApi.delete(id);
      router.push("/");
    } finally {
      setDeleting(false);
    }
  }

  if (!project) {
    return (
      <>
        <AppHeader right={<Link href="/"><Button variant="ghost">My Projects</Button></Link>} />
        <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-tertiary)" }}>
          Loading project…
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        showAutosave
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteProject}
              style={deleteConfirm ? { color: "#dc2626", borderColor: "#dc2626" } : { color: "var(--text-tertiary)" }}
            >
              {deleting ? "Deleting…" : deleteConfirm ? "Confirm delete?" : "🗑 Delete project"}
            </Button>
            {deleteConfirm && (
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            )}
            <Link href="/"><Button variant="ghost">My Projects</Button></Link>
          </div>
        }
      />
      <div className="project-shell">
        <div className="breadcrumb">
          <Link href="/">My Projects</Link>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-current">{project.title}</span>
        </div>

        <ProjectHero project={{ ...project, videos }} onVideoGenerated={handleGenerateVideo} />
        <StorylineGrid project={project} />
        <SceneTimeline scenes={project.scenes || []} projectId={id} />
        <ExportSection project={project} onSaved={(p) => mutate({ ...project, ...p })} />
        <VideosSection
          videos={videos}
          onGenerateNew={handleGenerateVideo}
          onDeleted={(videoId) => setVideos((prev) => prev.filter((v) => v.id !== videoId))}
        />
      </div>
    </>
  );
}
