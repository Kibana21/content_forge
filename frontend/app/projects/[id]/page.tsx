"use client";
import { use } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ProjectHero } from "@/components/project/ProjectHero";
import { StorylineGrid } from "@/components/project/StorylineGrid";
import { SceneTimeline } from "@/components/project/SceneTimeline";
import { VideosSection } from "@/components/project/VideosSection";
import { useProject } from "@/hooks/useProject";
import { useVideoPolling } from "@/hooks/useVideoPolling";
import { videosApi } from "@/lib/api/videos";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, mutate } = useProject(id);
  const { videos, setVideos } = useVideoPolling(project?.videos || []);

  async function handleGenerateVideo() {
    const video = await videosApi.generate(id);
    setVideos((prev) => [video, ...prev]);
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
        right={<Link href="/"><Button variant="ghost">My Projects</Button></Link>}
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
        <VideosSection videos={videos} onGenerateNew={handleGenerateVideo} />
      </div>
    </>
  );
}
