"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useEditorStore } from "@/stores/useEditorStore";

interface StepFooterProps {
  projectId: string;
  continueLabel?: string;
  onContinue?: () => void | Promise<void>;
  loading?: boolean;
}

export function StepFooter({ projectId, continueLabel = "Continue", onContinue, loading }: StepFooterProps) {
  const router = useRouter();
  const { activeStep, goToStep } = useEditorStore();

  const handleBack = () => {
    if (activeStep === 1) {
      router.push(`/projects/${projectId}`);
    } else {
      goToStep(activeStep - 1);
    }
  };

  return (
    <div className="step-footer">
      <Button variant="ghost" onClick={handleBack}>
        {activeStep === 1 ? "← Back to Project" : "← Back"}
      </Button>
      <Button loading={loading} onClick={onContinue} size="lg">
        {continueLabel}
      </Button>
    </div>
  );
}
