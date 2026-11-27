"use client";

import { useState } from "react";

import ViewOne, { P } from "./view-one";
import ViewTwo from "./view-two";
import ViewThree from "./view-three";

/* The same dashboard in more than one design, so the client can compare them. */
const OPTIONS = [
  { key: 1, label: "View option 1" },
  { key: 2, label: "View option 2" },
  { key: 3, label: "View option 3" },
] as const;

export default function RiskCohortsPage() {
  const [option, setOption] = useState<1 | 2 | 3>(1);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="text-[13px] font-medium" style={{ color: P.quiet }}>
          Design
        </span>
        <div className="inline-flex rounded-full bg-white p-[3px]" style={{ border: `1px solid ${P.line}` }}>
          {OPTIONS.map((o) => (
            <button
              key={o.key}
              aria-pressed={option === o.key}
              onClick={() => setOption(o.key)}
              className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors"
              style={option === o.key ? { backgroundColor: P.purple, color: "#fff" } : { color: P.quiet }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {option === 1 ? <ViewOne /> : option === 2 ? <ViewTwo /> : <ViewThree />}
    </div>
  );
}
