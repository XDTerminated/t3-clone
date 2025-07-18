"use client";

import * as React from "react";
import { useSidebar } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { cn } from "~/lib/utils";
import { useChat } from "~/contexts/ChatContext";
import { ApiKeyDialog } from "~/components/api-key-dialog";
import { ErrorDialog } from "~/components/error-dialog";
import { SettingsDialog } from "~/components/settings-dialog";
import { LoginDialog } from "~/components/login-dialog";

/**
 * Client-side wrapper that renders the sidebar and main content with a conditional border
 */
export default function ContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open } = useSidebar();
  const {
    apiKeyDialogOpen,
    handleApiKeySubmit,
    settingsDialogOpen,
    setSettingsDialogOpen,
    errorDialogOpen,
    errorDialogTitle,
    errorDialogMessage,
    errorDialogType,
    setErrorDialogOpen,
    loginDialogOpen,
    loginDialogAction,
    setLoginDialogOpen,
  }: {
    apiKeyDialogOpen: boolean;
    handleApiKeySubmit: (keys: {
      openRouterKey?: string;
      geminiKey?: string;
    }) => void;
    settingsDialogOpen: boolean;
    setSettingsDialogOpen: (open: boolean) => void;
    errorDialogOpen: boolean;
    errorDialogTitle: string;
    errorDialogMessage: string;
    errorDialogType?: string;
    setErrorDialogOpen: (open: boolean) => void;
    loginDialogOpen: boolean;
    loginDialogAction: "send" | "chat" | null;
    setLoginDialogOpen: (open: boolean) => void;
  } = useChat();
  const mainRef = React.useRef<HTMLElement>(null);

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Animated top gap for sidebar open/close */}
      <div
        className={cn(
          "bg-sidebar relative z-30 w-full overflow-hidden transition-[height] duration-100 ease-linear",
          open ? "h-4" : "h-0",
        )}
      />
      {/* Wrapper row animates layout shift */}
      <div className="bg-sidebar flex w-full flex-1 overflow-hidden">
        <AppSidebar />{" "}
        <main
          ref={mainRef}
          className={cn(
            "main-chat-container bg-background flex-grow overflow-y-scroll dark:bg-gradient-to-br dark:from-[#2d0a0f] dark:to-[#1a0609]",
            "border-t border-l transition-colors duration-100 ease-linear",
            open
              ? "border-sidebar-border rounded-tl-2xl"
              : "border-transparent",
          )}
        >
          {children}
        </main>
      </div>{" "}
      {/* API Key Dialog */}
      <ApiKeyDialog
        open={apiKeyDialogOpen}
        onApiKeysSubmit={handleApiKeySubmit}
      />
      {/* Login Dialog */}
      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        action={loginDialogAction ?? "send"}
      />
      {/* Error Dialog */}
      <ErrorDialog
        open={errorDialogOpen}
        onOpenChange={setErrorDialogOpen}
        title={errorDialogTitle}
        message={errorDialogMessage}
        errorType={errorDialogType}
      />
      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />
    </div>
  );
}
