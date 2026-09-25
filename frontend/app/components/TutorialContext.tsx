"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ─── Tutorial Step Definition ───────────────────────────────────────────────

export type TutorialStep = {
  /** Unique identifier */
  id: string;
  /** CSS selector (e.g. "#app-sidebar") or element id string */
  targetId: string;
  /** Tooltip heading */
  title: string;
  /** 1–2 sentence explanation */
  description: string;
  /** Which side of the highlighted element the tooltip prefers */
  placement: "top" | "bottom" | "left" | "right";
};

// ─── Tour steps — 5 total (all target sidebar elements, always visible on every page) ───

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "step-sidebar",
    targetId: "app-sidebar",
    title: "Your Navigation Hub",
    description:
      "The sidebar is your control centre — jump between Dashboard, Master Profile, My Vault, and Settings at any time.",
    placement: "right",
  },
  {
    id: "step-dashboard-nav",
    targetId: "sidebar-nav-dashboard",
    title: "Dashboard",
    description:
      "Your home base. See your total resumes, profile completion score, and a quick-start shortcut all in one glance.",
    placement: "right",
  },
  {
    id: "step-profile",
    targetId: "sidebar-nav-profile",
    title: "Master Profile",
    description:
      "Fill this once with your education, experience, and skills. AI uses it to auto-populate every resume you create.",
    placement: "right",
  },
  {
    id: "step-resumes",
    targetId: "sidebar-nav-resumes",
    title: "My Vault",
    description:
      "All your resumes live here. Create new ones, rename, duplicate, preview, or delete them — all from one place.",
    placement: "right",
  },
  {
    id: "step-settings",
    targetId: "sidebar-nav-settings",
    title: "Settings & Preferences",
    description:
      "Toggle dark/light mode, reset your password, or re-launch this tutorial anytime from the Settings page.",
    placement: "right",
  },
];

// ─── Context shape ───────────────────────────────────────────────────────────

interface TutorialContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  goToStep: (index: number) => void;
}

const TutorialContext = createContext<TutorialContextValue>({
  isActive: false,
  currentStep: 0,
  totalSteps: TUTORIAL_STEPS.length,
  startTutorial: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTutorial: () => {},
  goToStep: () => {},
});

// ─── localStorage key ────────────────────────────────────────────────────────

const TUTORIAL_SEEN_KEY = "makemycv_tutorial_seen";

// ─── Provider ────────────────────────────────────────────────────────────────

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // NOTE: Auto-start for new users is handled by AppSidebar,
  // which only mounts on authenticated pages — ensuring getToken()
  // is guaranteed to return a valid token when the check runs.

  const endTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
  }, []);

  const startTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= TUTORIAL_STEPS.length - 1) {
        endTutorial();
        return 0;
      }
      return prev + 1;
    });
  }, [endTutorial]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipTutorial = useCallback(() => {
    endTutorial();
  }, [endTutorial]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < TUTORIAL_STEPS.length) {
      setCurrentStep(index);
    }
  }, []);

  // Escape key closes the tutorial
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") skipTutorial();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, skipTutorial]);

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: TUTORIAL_STEPS.length,
        startTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        goToStep,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTutorial(): TutorialContextValue {
  return useContext(TutorialContext);
}
