import { ArrowLeft } from "lucide-react";

const LANDING_URL = "https://habit-showcase.vercel.app";

/**
 * Universal strip above every dashboard, linking back out to the Habit Health
 * landing page.
 *
 * Deliberately the one dark band in the portal so it reads as chrome rather
 * than as part of a dashboard card. Uses the brand navy already used for the
 * sidebar's active states.
 *
 * Rendered as a <nav> so the existing print stylesheet (see PageDownload) drops
 * it from downloaded/printed pages along with the other chrome.
 */
export function BackToLanding() {
  return (
    <nav className="shrink-0" style={{ backgroundColor: "#1E4088" }}>
      <a
        href={LANDING_URL}
        className="group flex items-center gap-3 px-6 py-4 text-[15px] font-bold tracking-[-0.01em] text-white transition-colors hover:bg-[#183566]"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform group-hover:-translate-x-0.5"
          style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
        >
          <ArrowLeft className="size-[18px]" />
        </span>
        <span className="group-hover:underline">Go back to the Habit Health Landing page</span>
      </a>
    </nav>
  );
}
