"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const PRINT_STYLE_ID = "page-download-print-styles";

function injectPrintStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      aside, nav,
      [data-walkthrough],
      .recharts-tooltip-wrapper,
      [class*="Tooltip"],
      button:not([data-print-keep]),
      select, input[type="text"], input[type="date"],
      [class*="popover"], [class*="Popover"],
      [class*="dropdown"], [class*="Dropdown"] {
        display: none !important;
      }
      main, [role="main"], .flex-1 {
        margin: 0 !important; padding: 20px !important;
        width: 100% !important; max-width: 100% !important;
      }
      .overflow-y-auto, .overflow-auto, .overflow-x-auto,
      [style*="overflow"], [class*="overflow"] {
        overflow: visible !important; max-height: none !important; height: auto !important;
      }
      .fixed, .sticky, [style*="position: fixed"], [style*="position: sticky"] { position: relative !important; }
      .h-screen, .h-full, [style*="height: 100vh"], [style*="calc(100vh"] { height: auto !important; min-height: 0 !important; }
      aside { display: none !important; width: 0 !important; }
      .shadow, .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl,
      [style*="boxShadow"], [style*="box-shadow"] { box-shadow: none !important; }
      .hover\\:-translate-y-px:hover { transform: none !important; }
      @page { size: A4 landscape; margin: 15mm; }
      body { font-size: 11px !important; }
      svg, canvas { max-width: 100% !important; height: auto !important; }
      .rounded-2xl { border: 1px solid #E5E7EB !important; break-inside: avoid; page-break-inside: avoid; }
      #print-header-bar { display: flex !important; }
      #print-footer-bar { display: block !important; }
    }
    #print-header-bar, #print-footer-bar { display: none; }
  `;
  document.head.appendChild(style);
}

export function PageDownload({ pageTitle }: { pageTitle: string }) {
  const [downloading, setDownloading] = useState(false);
  useEffect(() => { injectPrintStyles(); }, []);
  function handleDownload() {
    setDownloading(true);
    const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const header = document.createElement("div");
    header.id = "print-header-bar";
    header.style.cssText = `display: none; align-items: center; justify-content: space-between; padding: 0 0 12px 0; margin-bottom: 16px; border-bottom: 2px solid #4f46e5;`;
    header.innerHTML = `<div><div style="font-size:18px;font-weight:800;color:#111827">${pageTitle}</div><div style="font-size:11px;color:#6B7280;margin-top:2px">Habit Intelligence Analytics Platform</div></div><div style="text-align:right;font-size:10px;color:#6B7280"><div>Generated: ${dateStr}</div><div>Confidential — for authorized use only</div></div>`;
    const footer = document.createElement("div");
    footer.id = "print-footer-bar";
    footer.style.cssText = `display: none; margin-top: 30px; padding-top: 8px; border-top: 1px solid #E5E7EB; font-size: 9px; color: #9CA3AF;`;
    footer.innerHTML = `Habit Intelligence — ${pageTitle} — Generated ${dateStr}`;
    const main = document.querySelector("main") ?? document.querySelector(".flex-1.overflow-y-auto");
    if (main) { main.prepend(header); main.appendChild(footer); }
    setTimeout(() => {
      window.print();
      header.remove();
      footer.remove();
      setDownloading(false);
    }, 300);
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border hover:bg-[#F5F6FA] transition-colors disabled:opacity-40"
          style={{ borderColor: "#ECEDF2", color: "#9399AB" }}
        >
          <Download size={15} className={downloading ? "animate-bounce" : ""} />
        </button>
      </TooltipTrigger>
      <TooltipContent>Download page as PDF</TooltipContent>
    </Tooltip>
  );
}
