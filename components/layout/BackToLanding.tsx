import { ArrowLeft } from "lucide-react";

const LANDING_URL = "https://habit-showcase.vercel.app";

/**
 * Universal strip above every dashboard, linking back out to the Habit Health
 * landing page.
 *
 * Rendered as a <nav> so the existing print stylesheet (see PageDownload) drops
 * it from downloaded/printed pages along with the other chrome.
 */
export function BackToLanding() {
  return (
    <nav
      className="shrink-0 border-b bg-white px-6 py-2.5"
      style={{ borderColor: "#E5E7EB" }}
    >
      <a
        href={LANDING_URL}
        className="group inline-flex items-center gap-2 text-[13px] font-semibold text-[#4B5563] transition-colors hover:text-[#4f46e5]"
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full border transition-colors group-hover:border-[#4f46e5] group-hover:bg-[#eef2ff]"
          style={{ borderColor: "#E5E7EB" }}
        >
          <ArrowLeft className="size-3.5" />
        </span>
        Go back to the Habit Health Landing page
      </a>
    </nav>
  );
}
