"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { walkthroughSteps } from "./walkthrough-steps";

const STORAGE_KEY = "habit-walkthrough-seen";

interface WalkthroughContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  /** Whether the current step wants the sidebar expanded */
  shouldExpandSidebar: boolean;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  goToStep: (n: number) => void;
}

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null);

export function useWalkthrough() {
  const ctx = useContext(WalkthroughContext);
  if (!ctx)
    throw new Error("useWalkthrough must be used within WalkthroughProvider");
  return ctx;
}

export function WalkthroughProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-start on first visit
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen) return;

    const timer = setTimeout(() => {
      setCurrentStep(0);
      setIsActive(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= walkthroughSteps.length - 1) {
        completeTour();
        return 0;
      }
      return prev + 1;
    });
  }, [completeTour]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const goToStep = useCallback(
    (n: number) => {
      if (n >= 0 && n < walkthroughSteps.length) {
        setCurrentStep(n);
      }
    },
    []
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        completeTour();
      } else if (e.key === "ArrowRight") {
        nextStep();
      } else if (e.key === "ArrowLeft") {
        prevStep();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, completeTour, nextStep, prevStep]);

  return (
    <WalkthroughContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: walkthroughSteps.length,
        shouldExpandSidebar:
          isActive && walkthroughSteps[currentStep]?.expandSidebar === true,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        goToStep,
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
}
