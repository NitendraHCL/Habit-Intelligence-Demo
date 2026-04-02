"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { useWalkthrough } from "./WalkthroughProvider";

export function WalkthroughTrigger() {
  const { isActive, startTour } = useWalkthrough();
  const [shouldPulse, setShouldPulse] = useState(false);

  // Pulse on first appearance after tour dismissal
  useEffect(() => {
    if (!isActive) {
      const seen = localStorage.getItem("habit-walkthrough-seen");
      if (seen) {
        setShouldPulse(true);
        const timer = setTimeout(() => setShouldPulse(false), 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [isActive]);

  if (isActive) return null;

  return (
    <button
      onClick={startTour}
      className={shouldPulse ? "animate-walkthrough-pulse" : ""}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 18px",
        borderRadius: 999,
        background: "white",
        border: "1.5px solid #6366f1",
        color: "#4f46e5",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#4f46e5";
        e.currentTarget.style.color = "white";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(79,70,229,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "white";
        e.currentTarget.style.color = "#4f46e5";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
      }}
      aria-label="Show me Around"
    >
      <Compass size={16} />
      Show me Around
    </button>
  );
}
