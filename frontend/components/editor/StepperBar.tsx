"use client";
import { clsx } from "clsx";
import { useEditorStore } from "@/stores/useEditorStore";

const STEPS = [
  { num: 1, label: "Brief" },
  { num: 2, label: "Presenter" },
  { num: 3, label: "Script" },
  { num: 4, label: "Storyboard" },
  { num: 5, label: "Review & Export" },
];

export function StepperBar() {
  const { activeStep, completedSteps, goToStep } = useEditorStore();

  return (
    <div className="stepper-bar">
      <div className="stepper-inner">
        {STEPS.map((step, idx) => {
          const isActive = step.num === activeStep;
          const isCompleted = completedSteps.has(step.num);
          const canClick = isCompleted || isActive;

          return (
            <div key={step.num} style={{ display: "flex", alignItems: "center" }}>
              <div
                className={clsx(
                  "step-item",
                  isActive && "active",
                  isCompleted && !isActive && "completed",
                  !canClick && "disabled"
                )}
                onClick={() => canClick && goToStep(step.num)}
              >
                <div className="step-circle">
                  {isCompleted && !isActive ? "✓" : step.num}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={clsx("step-connector", isCompleted && "completed")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
