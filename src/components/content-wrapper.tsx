"use client";

import * as React from "react";
import { useSidebar } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { cn } from "~/lib/utils";
import { useChat } from "~/contexts/ChatContext";
import { ApiKeyDialog } from "~/components/api-key-dialog";

/**
 * Client-side wrapper that renders the sidebar and main content with a conditional border
 */
export default function ContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open } = useSidebar();
  const { apiKeyDialogOpen, handleApiKeySubmit } = useChat();
  const mainRef = React.useRef<HTMLElement>(null);

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Animated top gap for sidebar open/close */}
      <div
        className={cn(
          "bg-sidebar w-full overflow-hidden transition-[height] duration-100 ease-linear",
          open ? "h-4" : "h-0",
        )}
      />
      {/* Wrapper row animates layout shift */}
      <div className="bg-sidebar flex w-full flex-1 overflow-hidden">
        <AppSidebar />
        <main
          ref={mainRef}
          className={cn(
            "main-chat-container bg-background flex-grow overflow-y-scroll dark:bg-[radial-gradient(ellipse_at_center,var(--background)_20%,oklch(0.235_0.017_290)_100%)]",
            "border-t border-l transition-colors duration-100 ease-linear",
            open
              ? "border-sidebar-border rounded-tl-2xl"
              : "border-transparent",
          )}
        >
          {children}
        </main>
      </div>

      {/* API Key Dialog */}
      <ApiKeyDialog
        open={apiKeyDialogOpen}
        onApiKeySubmit={handleApiKeySubmit}
      />
    </div>
  );
}
