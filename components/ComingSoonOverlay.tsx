"use client";

import { useState, useLayoutEffect } from "react";
import { Lock } from "lucide-react";

export function ComingSoonOverlay() {
  const [show, setShow] = useState(true);
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number }>({ left: 0, top: 0, width: 0, height: 0 });

  useLayoutEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const update = () => {
      const r = main.getBoundingClientRect();
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(main);
    window.addEventListener("resize", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); };
  }, []);

  if (!show) return null;

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          background: "linear-gradient(135deg, rgba(238,242,255,0.72) 0%, rgba(237,233,254,0.78) 100%)",
          backdropFilter: "blur(4px) saturate(120%)",
          WebkitBackdropFilter: "blur(4px) saturate(120%)",
          pointerEvents: "none",
          zIndex: 40,
        }}
      />
      <div
        style={{
          position: "fixed",
          left: rect.left + rect.width / 2,
          top: rect.top + rect.height / 2,
          transform: "translate(-50%, -50%)",
          zIndex: 50,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "20px 30px",
          borderRadius: 22,
          background: "linear-gradient(135deg, rgba(79,70,229,0.96) 0%, rgba(109,40,217,0.96) 100%)",
          color: "#fff",
          boxShadow: "0 24px 60px -18px rgba(79,70,229,0.5), 0 8px 28px -8px rgba(109,40,217,0.4), inset 0 1px 0 rgba(255,255,255,0.25)",
          border: "1px solid rgba(255,255,255,0.25)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          minWidth: 220,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.3)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          <Lock size={18} strokeWidth={2.4} style={{ color: "#fde68a" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(253,230,138,0.9)", marginBottom: 4 }}>Preview</div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.1 }}>Coming Soon</div>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: "rgba(255,255,255,0.82)", marginTop: 6, maxWidth: 220, lineHeight: 1.45 }}>
            This module is in active development. The data below is a preview of what&apos;s coming.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShow(false)}
          style={{
            pointerEvents: "auto",
            marginTop: 2,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.96)",
            color: "#4f46e5",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.02em",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 6px 18px -6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.6)",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
        >
          Preview
        </button>
      </div>
    </>
  );
}
