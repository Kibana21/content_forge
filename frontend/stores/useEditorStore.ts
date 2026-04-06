"use client";
import { create } from "zustand";

type Step = 1 | 2 | 3 | 4 | 5;

interface EditorStore {
  activeStep: Step;
  completedSteps: Set<number>;
  isDirty: boolean;
  goToStep: (step: number) => void;
  markStepComplete: (step: number) => void;
  setDirty: (dirty: boolean) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  activeStep: 1,
  completedSteps: new Set(),
  isDirty: false,

  goToStep: (step) => set({ activeStep: step as Step }),

  markStepComplete: (step) =>
    set((s) => ({ completedSteps: new Set([...s.completedSteps, step]) })),

  setDirty: (dirty) => set({ isDirty: dirty }),

  reset: () => set({ activeStep: 1, completedSteps: new Set(), isDirty: false }),
}));
