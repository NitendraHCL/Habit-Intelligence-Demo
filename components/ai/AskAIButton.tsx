"use client";

import { Sparkles } from "lucide-react";
import { useAIPanel } from "@/lib/ai-panel-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface AskAIButtonProps {
  title: string;
  description?: string;
  data: unknown;
  kamComments?: { author: string; text: string; date: string }[];
}

export function AskAIButton({ title, description, data, kamComments }: AskAIButtonProps) {
  const { openPanel } = useAIPanel();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => openPanel({ title, description, data, kamComments })}
        >
          <Sparkles size={14} className="text-blue-500/70 hover:text-blue-500 transition-colors" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">Ask HabitAI</TooltipContent>
    </Tooltip>
  );
}
