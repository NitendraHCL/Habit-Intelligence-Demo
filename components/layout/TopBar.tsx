"use client";

import {
  Bell,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TopBar() {
  return (
    <header data-walkthrough="topbar" className="sticky top-0 z-30 flex h-11 shrink-0 items-center justify-end border-b border-[#F3F4F6] bg-white/90 px-5 backdrop-blur-md">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F5F6FA]">
          <Download className="size-[15px]" />
        </Button>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F5F6FA]">
          <Bell className="size-[15px]" />
          <Badge className="absolute -right-0.5 -top-0.5 flex size-[14px] items-center justify-center rounded-full p-0 text-[8px] font-bold">
            3
          </Badge>
        </Button>
      </div>
    </header>
  );
}
