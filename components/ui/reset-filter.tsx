"use client";

import { RotateCcw } from "lucide-react";

interface ResetFilterProps {
  onClick: () => void;
  visible: boolean;
}

export function ResetFilter({ onClick, visible }: ResetFilterProps) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all hover:bg-red-50"
      style={{ color: "#ef4444", border: "1px solid #fecaca" }}
      title="Reset filter"
    >
      <RotateCcw size={10} />
      Reset
    </button>
  );
}
