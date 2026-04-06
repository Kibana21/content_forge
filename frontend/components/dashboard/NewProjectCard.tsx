"use client";
import { useRouter } from "next/navigation";
import { projectsApi } from "@/lib/api/projects";

export function NewProjectCard() {
  const router = useRouter();

  async function handleCreate() {
    const project = await projectsApi.create({ title: "Untitled Project" });
    router.push(`/projects/${project.id}/edit`);
  }

  return (
    <div className="new-project-card" onClick={handleCreate}>
      <div className="new-project-plus">+</div>
      <span style={{ fontSize: 14, fontWeight: 600 }}>Start New Project</span>
    </div>
  );
}
