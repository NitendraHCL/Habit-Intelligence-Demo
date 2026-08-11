"use client";

import { AuthProvider } from "@/lib/contexts/auth-context";
import { ConfigProvider } from "@/lib/contexts/config-context";
import { FilterProvider } from "@/lib/filter-context";
import { AIPanelProvider } from "@/lib/ai-panel-context";
import { Sidebar } from "@/components/layout/Sidebar";
import { BackToLanding } from "@/components/layout/BackToLanding";
import AskHabitAI from "@/components/ai/AskHabitAI";
import { WalkthroughProvider } from "@/components/walkthrough/WalkthroughProvider";
import { WalkthroughOverlay } from "@/components/walkthrough/WalkthroughOverlay";
import { WalkthroughTrigger } from "@/components/walkthrough/WalkthroughTrigger";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ConfigProvider>
      <FilterProvider>
        <AIPanelProvider>
          <WalkthroughProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              {/* Strip sits outside the scroll container so it stays put as the
                  dashboard scrolls */}
              <div className="flex flex-1 flex-col min-w-0">
                <BackToLanding />
                <main className="flex-1 overflow-y-auto bg-[#F5F6FA] p-6">{children}</main>
              </div>
            </div>
            <AskHabitAI />
            <WalkthroughOverlay />
            <WalkthroughTrigger />
          </WalkthroughProvider>
        </AIPanelProvider>
      </FilterProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}
