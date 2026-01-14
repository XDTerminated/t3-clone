"use client";

import * as React from "react";
import { Settings, Palette } from "lucide-react";
import { cn } from "~/lib/utils";
import { useSidebar } from "~/components/ui/sidebar";
import { useAuth } from "@clerk/nextjs";
import { useChat } from "~/contexts/ChatContext";
import { useTheme } from "~/contexts/ThemeContext";
import { ThemeSelectorDialog } from "~/components/dialogs";

export default function TopRightIconHolder({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { state } = useSidebar();
  const { isSignedIn } = useAuth();
  const { setLoginDialogOpen, setLoginDialogAction, setSettingsDialogOpen } =
    useChat();
  const { setShowThemeSelector } = useTheme();
  const isCollapsed = state === "collapsed";

  const handleThemeClick = () => {
    setShowThemeSelector(true);
  };
  const handleSettingsClick = () => {
    if (!isSignedIn) {
      setLoginDialogAction("send");
      setLoginDialogOpen(true);
    } else {
      setSettingsDialogOpen(true);
    }
  };
  return (
    <div
      className="fixed top-0 -right-4 z-20 h-16 w-36 max-sm:hidden"
      style={{ clipPath: "inset(0px 12px 0px 0px)" }}
    >
      <div
        className={cn(
          "bg-sidebar absolute top-0 left-0 h-4 w-full transition-opacity duration-100 ease-linear",
          isCollapsed ? "opacity-0" : "opacity-100",
        )}
      />
      <div className="group ease-snappy pointer-events-none absolute top-4 z-10 -mb-8 h-32 w-full origin-top transition-all">
        {" "}
        <svg
          className={cn(
            "absolute -right-12 h-9 origin-top-left skew-x-[30deg] overflow-visible transition-all duration-100 ease-linear",
            isCollapsed
              ? "translate-y-[-100%] opacity-0"
              : "translate-y-0 opacity-100",
          )}
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 160 32"
          xmlSpace="preserve"
        >
          {" "}
          <line
            className="stroke-sidebar"
            strokeWidth="2px"
            shapeRendering="optimizeQuality"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeMiterlimit="10"
            x1="1"
            y1="0"
            x2="160"
            y2="0"
          />{" "}
          <path
            stroke="currentColor"
            className="stroke-sidebar-border fill-sidebar translate-y-[0.5px]"
            fill="currentColor"
            shapeRendering="optimizeQuality"
            strokeWidth="1px"
            strokeLinecap="round"
            strokeMiterlimit="10"
            vectorEffect="non-scaling-stroke"
            d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H160V0"
          />{" "}
        </svg>{" "}
        {/* Icons positioned within the SVG decorative area */}
        {/* Rectangle background matching sidebar toggle container */}{" "}
        <div
          className={cn(
            "fixed top-2 right-2 z-0 rounded-md p-1 transition-opacity duration-100 ease-linear",
            "bg-sidebar",
            isCollapsed ? "opacity-100" : "opacity-0",
          )}
          style={{ width: "70px", height: "36px" }}
        />{" "}
        <div
          className={cn(
            "pointer-events-auto fixed top-2 right-2 z-10 flex items-center p-1",
          )}
        >
          {" "}
          <button
            onClick={handleSettingsClick}
            className={cn(
              "flex size-7 items-center justify-center rounded-lg transition-colors",
              "hover:bg-sidebar-accent/30 focus:ring-sidebar-ring focus:ring-1 focus:outline-none",
              "text-sidebar-foreground/80 hover:text-sidebar-foreground",
            )}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>{" "}
          <button
            onClick={handleThemeClick}
            className={cn(
              "ml-2 flex size-7 items-center justify-center rounded-lg transition-colors",
              "hover:bg-sidebar-accent/30 focus:ring-sidebar-ring focus:ring-1 focus:outline-none",
              "text-sidebar-foreground/80 hover:text-sidebar-foreground",
            )}
            aria-label="Change color theme"
          >
            <Palette className="h-4 w-4" />
          </button>
        </div>{" "}
        {children && (
          <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
      <ThemeSelectorDialog />
    </div>
  );
}
