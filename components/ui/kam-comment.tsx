"use client";

import { MessageSquareText } from "lucide-react";

const T = {
  commentBg: "#F0F4FF",
  commentBorder: "#C7D6F5",
  commentText: "#1E3A6E",
  labelBg: "#1E4088",
  labelText: "#FFFFFF",
};

export function KAMComment({ comment, author = "HCL KAM", date }: {
  comment: string;
  author?: string;
  date?: string;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3 mt-3 text-[12px] leading-relaxed"
      style={{
        backgroundColor: T.commentBg,
        border: `1px solid ${T.commentBorder}`,
        color: T.commentText,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
          style={{ backgroundColor: T.labelBg, color: T.labelText }}
        >
          <MessageSquareText size={10} />
          {author}
        </span>
        {date && (
          <span className="text-[10px] font-medium" style={{ color: "#7B8DB6" }}>
            {date}
          </span>
        )}
      </div>
      <p className="text-[12px] leading-relaxed" style={{ color: T.commentText }}>
        {comment}
      </p>
    </div>
  );
}
