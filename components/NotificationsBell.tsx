"use client";

import { Bell, MessageSquare, AlertCircle, BarChart3, FileText, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type NotificationItem = {
  id: string;
  icon: "comment" | "alert" | "chart" | "report" | "ai";
  title: string;
  body: string;
  time: string;
  unread?: boolean;
};

const ICONS: Record<NotificationItem["icon"], { Comp: typeof Bell; bg: string; fg: string }> = {
  comment: { Comp: MessageSquare, bg: "#EEF2FF", fg: "#4F46E5" },
  alert: { Comp: AlertCircle, bg: "#FEF3C7", fg: "#B45309" },
  chart: { Comp: BarChart3, bg: "#ECFDF5", fg: "#0D9488" },
  report: { Comp: FileText, bg: "#FEF2F2", fg: "#DC2626" },
  ai: { Comp: Sparkles, bg: "#F5F3FF", fg: "#7C3AED" },
};

const DUMMY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    icon: "comment",
    title: "HCL KAM added a comment",
    body: "Flagged the dip in repeat visits across the Bengaluru clinic for Q1 — recommends a callback drive.",
    time: "12 min ago",
    unread: true,
  },
  {
    id: "n2",
    icon: "alert",
    title: "Critical risk alert",
    body: "3 self-harm assessment cases logged this week at the Chennai night-shift OHC. Escalated to ops.",
    time: "2 h ago",
    unread: true,
  },
  {
    id: "n3",
    icon: "ai",
    title: "AskAI summary ready",
    body: "Your monthly utilisation digest for Apr 2026 is now available on the home dashboard.",
    time: "Yesterday",
    unread: true,
  },
  {
    id: "n4",
    icon: "chart",
    title: "Anomaly detected",
    body: "Referral conversion rate dropped 8 pts vs last month for Cardiology — investigate scheduling.",
    time: "2 days ago",
  },
  {
    id: "n5",
    icon: "report",
    title: "Quarterly report shared",
    body: "Pooja Mehta shared the Q1 OHC report with you and 4 other reviewers.",
    time: "5 days ago",
  },
];

export function NotificationsBell({ count = 3 }: { count?: number }) {
  const unread = DUMMY_NOTIFICATIONS.filter((n) => n.unread).length;
  const badge = count ?? unread;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative h-8 w-8 inline-flex items-center justify-center rounded-lg border hover:bg-[#F5F6FA] transition-colors"
          style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
          aria-label="Notifications"
        >
          <Bell size={15} />
          {badge > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#DC2626] text-[8px] font-bold text-white">
              {badge}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#EEF0F4" }}>
          <div>
            <p className="text-[13px] font-bold" style={{ color: "#111827" }}>Notifications</p>
            <p className="text-[11px]" style={{ color: "#6B7280" }}>{unread} unread</p>
          </div>
          <button className="text-[11px] font-semibold" style={{ color: "#4F46E5" }}>Mark all read</button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {DUMMY_NOTIFICATIONS.map((n) => {
            const conf = ICONS[n.icon];
            const Icon = conf.Comp;
            return (
              <div
                key={n.id}
                className="flex gap-3 px-4 py-3 border-b cursor-pointer hover:bg-[#FAFAFB] transition-colors"
                style={{ borderColor: "#EEF0F4", backgroundColor: n.unread ? "#FAFBFF" : "#FFFFFF" }}
              >
                <div
                  className="shrink-0 w-8 h-8 rounded-lg inline-flex items-center justify-center"
                  style={{ backgroundColor: conf.bg, color: conf.fg }}
                >
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-semibold leading-tight" style={{ color: "#111827" }}>
                      {n.title}
                    </p>
                    {n.unread && (
                      <span className="shrink-0 h-1.5 w-1.5 mt-1 rounded-full" style={{ backgroundColor: "#4F46E5" }} />
                    )}
                  </div>
                  <p className="text-[11.5px] leading-snug mt-0.5" style={{ color: "#6B7280" }}>
                    {n.body}
                  </p>
                  <p className="text-[10.5px] mt-1.5" style={{ color: "#9CA3AF" }}>{n.time}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2.5 text-center border-t" style={{ borderColor: "#EEF0F4" }}>
          <button className="text-[12px] font-semibold" style={{ color: "#4F46E5" }}>View all notifications</button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
