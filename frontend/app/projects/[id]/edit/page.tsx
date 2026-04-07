"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { StepperBar } from "@/components/editor/StepperBar";
import { StepBrief } from "@/components/editor/steps/StepBrief";
import { StepPresenter } from "@/components/editor/steps/StepPresenter";
import { StepScript } from "@/components/editor/steps/StepScript";
import { StepStoryboard } from "@/components/editor/steps/StepStoryboard";
import { StepReviewExport } from "@/components/editor/steps/StepReviewExport";
import { useEditorStore } from "@/stores/useEditorStore";
import { useProject } from "@/hooks/useProject";
import type { Project } from "@/lib/types/project";

export default function EditorPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { id } = use(params);
  const { step: stepParam } = use(searchParams);
  const { project: fetchedProject, mutate } = useProject(id);
  const [project, setProject] = useState<Project | null>(null);
  const { activeStep, goToStep, markStepComplete, reset } = useEditorStore();

  useEffect(() => {
    if (fetchedProject && !project) {
      setProject(fetchedProject);
      // Infer completed steps from project data so the stepper reflects reality
      const p = fetchedProject;
      if (p.title && p.video_type && p.target_duration) markStepComplete(1);
      if (p.presenter_id) markStepComplete(2);
      if (p.script) markStepComplete(3);
      if (p.scenes && p.scenes.length > 0) markStepComplete(4);
    }
  }, [fetchedProject]);

  useEffect(() => {
    const step = Number(stepParam);
    if (step >= 1 && step <= 5) {
      goToStep(step);
    } else {
      reset();
    }
  }, [stepParam]);

  function handleSaved(updated: Project) {
    setProject(updated);
    mutate(updated, false);
  }

  if (!project) {
    return (
      <>
        <AppHeader />
        <StepperBar />
        <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-tertiary)" }}>
          Loading editor…
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        showAutosave
        right={
          <Link href={`/projects/${id}`}>
            <Button variant="ghost">Back to Project</Button>
          </Link>
        }
      />
      <StepperBar />

      {activeStep === 1 && <StepBrief project={project} onSaved={handleSaved} />}
      {activeStep === 2 && <StepPresenter project={project} onSaved={handleSaved} />}
      {activeStep === 3 && <StepScript project={project} onSaved={handleSaved} />}
      {activeStep === 4 && <StepStoryboard project={project} onSaved={handleSaved} />}
      {activeStep === 5 && <StepReviewExport project={project} onSaved={handleSaved} />}
    </>
  );
}
