"use client";

import { createContext, useContext, useState, useCallback } from "react";

export interface AIPanelData {
  title: string;
  description?: string;
  data: unknown;
  kamComments?: { author: string; text: string; date: string }[];
}

interface AIPanelState {
  open: boolean;
  context: AIPanelData | null;
  openPanel: (ctx: AIPanelData) => void;
  closePanel: () => void;
}

const AIPanelContext = createContext<AIPanelState | null>(null);

export function AIPanelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<AIPanelData | null>(null);

  const openPanel = useCallback((ctx: AIPanelData) => {
    setContext(ctx);
    setOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <AIPanelContext.Provider value={{ open, context, openPanel, closePanel }}>
      {children}
    </AIPanelContext.Provider>
  );
}

export function useAIPanel() {
  const ctx = useContext(AIPanelContext);
  if (!ctx) throw new Error("useAIPanel must be used within AIPanelProvider");
  return ctx;
}
