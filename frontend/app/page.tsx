"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { NewProjectCard } from "@/components/dashboard/NewProjectCard";
import { useProjectStore } from "@/stores/useProjectStore";
import type { FilterTab } from "@/components/dashboard/FilterTabs";
import type { Project } from "@/lib/types/project";
import type { ProjectStats } from "@/lib/types/project";

const EMPTY_STATS: ProjectStats = { total: 0, drafts: 0, exported: 0, in_review: 0, videos_generated: 0 };

export default function DashboardPage() {
  const router = useRouter();
  const { projects, stats, loading, fetchProjects, fetchStats } = useProjectStore();
  const [tab, setTab] = useState<FilterTab>("all");

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, []);

  const filtered = projects.filter((p: Project) => {
    if (tab === "all") return true;
    if (tab === "draft") return p.status === "draft";
    if (tab === "exported") return p.status === "exported";
    if (tab === "in_review") return p.status === "in_review";
    return true;
  });

  const counts = {
    all: projects.length,
    draft: projects.filter((p) => p.status === "draft").length,
    exported: projects.filter((p) => p.status === "exported").length,
    in_review: projects.filter((p) => p.status === "in_review").length,
  };

  return (
    <>
      <AppHeader right={<Button variant="ghost" onClick={() => router.push("/")}>My Projects</Button>} />
      <div className="dashboard-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--text)" }}>My Projects</h1>
            <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
              Create and manage your AI video storylines.
            </p>
          </div>
          <Button onClick={async () => {
            const { projectsApi } = await import("@/lib/api/projects");
            const p = await projectsApi.create({ title: "Untitled Project" });
            router.push(`/projects/${p.id}/edit`);
          }}>+ New Project</Button>
        </div>

        <StatsRow stats={stats || EMPTY_STATS} />
        <FilterTabs active={tab} counts={counts} onChange={setTab} />

        {loading ? (
          <p style={{ color: "var(--text-tertiary)", textAlign: "center", paddingTop: 40 }}>Loading projects…</p>
        ) : (
          <div className="project-grid">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "var(--text-tertiary)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
                <p style={{ margin: 0, fontSize: 15 }}>No projects yet. Start by creating one!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
