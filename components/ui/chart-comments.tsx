"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageSquareText, Send, X } from "lucide-react";

export interface ChartComment {
  id: string;
  author: string;
  text: string;
  date: string;
  isKAM: boolean;
}

const T = {
  kamBg: "#F0F4FF",
  kamBorder: "#C7D6F5",
  kamText: "#1E3A6E",
  kamBadge: "#1E4088",
  clientBg: "#F6FBF9",
  clientBorder: "#C2E5D9",
  clientText: "#1A4D3E",
  clientBadge: "#0AB59E",
  white: "#FFFFFF",
  textPrimary: "#1A1D2B",
  textSecondary: "#5F6478",
  textMuted: "#9399AB",
  border: "#ECEDF2",
};

export function ChartComments({ comments, walkthroughId }: { comments: ChartComment[]; walkthroughId?: string }) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<ChartComment[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const allComments = [...comments, ...replies];

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, replies.length]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setReplies((prev) => [
      ...prev,
      {
        id: `reply-${Date.now()}`,
        author: "You",
        text: trimmed,
        date: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        isKAM: false,
      },
    ]);
    setInput("");
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  };

  return (
    <>
      {/* Comment badge button */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="relative inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors hover:bg-gray-100"
        title="View Key Account Manager comments"
        {...(walkthroughId ? { "data-walkthrough": walkthroughId } : {})}
      >
        <MessageSquareText size={14} style={{ color: T.kamBadge }} />
        <span
          className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1"
          style={{ backgroundColor: T.kamBadge }}
        >
          {allComments.length}
        </span>
      </button>

      {/* Modal — rendered via portal to escape parent overflow/stacking */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Modal Dialog */}
          <div
            className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl shadow-2xl"
            style={{ backgroundColor: T.white }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0 rounded-t-2xl"
              style={{ borderBottom: `1px solid ${T.border}` }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: T.kamBadge }}
                >
                  <MessageSquareText size={12} />
                  Key Account Manager Comments
                </span>
                <span className="text-[12px] font-medium" style={{ color: T.textMuted }}>
                  {allComments.length} comment{allComments.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X size={16} style={{ color: T.textSecondary }} />
              </button>
            </div>

            {/* Comments thread */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {allComments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: c.isKAM ? T.kamBg : T.clientBg,
                    border: `1px solid ${c.isKAM ? T.kamBorder : T.clientBorder}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide text-white"
                      style={{ backgroundColor: c.isKAM ? T.kamBadge : T.clientBadge }}
                    >
                      {c.isKAM ? "HCL KAM" : c.author}
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: T.textMuted }}>
                      {c.date}
                    </span>
                  </div>
                  <p
                    className="text-[12px] leading-relaxed"
                    style={{ color: c.isKAM ? T.kamText : T.clientText }}
                  >
                    {c.text}
                  </p>
                </div>
              ))}

              {allComments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquareText size={32} style={{ color: T.textMuted }} className="mb-3 opacity-40" />
                  <p className="text-[13px] font-medium" style={{ color: T.textMuted }}>No comments yet</p>
                </div>
              )}
            </div>

            {/* Reply input */}
            <div
              className="shrink-0 px-5 py-4 rounded-b-2xl"
              style={{ borderTop: `1px solid ${T.border}`, backgroundColor: "#FAFBFC" }}
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                  placeholder="Reply to Key Account Manager..."
                  className="flex-1 h-10 px-4 rounded-xl text-[13px] outline-none transition-colors"
                  style={{
                    border: `1px solid ${T.border}`,
                    color: T.textPrimary,
                    backgroundColor: T.white,
                  }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = T.clientBadge; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = T.border; }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0"
                  style={{
                    backgroundColor: input.trim() ? T.clientBadge : T.border,
                    color: T.white,
                    cursor: input.trim() ? "pointer" : "default",
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[10px] mt-2" style={{ color: T.textMuted }}>
                Your reply will be visible to the HCL Key Account Manager team
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
