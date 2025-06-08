"use client";

import * as React from "react";
import { Settings, Sun, Moon } from "lucide-react";
import { cn } from "~/lib/utils";
import { useSidebar } from "~/components/ui/sidebar";

/**
 * Top-right icon holder with decorative border that blends with the sidebar layout
 */
export default function TopRightIconHolder({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [isDark, setIsDark] = React.useState(true);
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Initialize theme state based on current HTML class
  React.useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newTheme = !isDark;
    setIsDark(newTheme);

    if (newTheme) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  };
  return (
    <div
      className="fixed top-0 -right-4 z-20 h-16 w-28 max-sm:hidden"
      style={{ clipPath: "inset(0px 12px 0px 0px)" }}
    >
      {" "}
      <div className="group ease-snappy pointer-events-none absolute top-4 z-10 -mb-8 h-32 w-full origin-top transition-all">
        <svg
          className={cn(
            "absolute -right-8 h-9 origin-top-left skew-x-[30deg] overflow-visible transition-all duration-300 ease-in-out",
            isCollapsed
              ? "translate-y-[-100%] opacity-0"
              : "translate-y-0 opacity-100",
          )}
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 128 32"
          xmlSpace="preserve"
        >
          <line
            stroke="currentColor"
            className="stroke-sidebar"
            strokeWidth="2px"
            shapeRendering="optimizeQuality"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeMiterlimit="10"
            x1="1"
            y1="0"
            x2="128"
            y2="0"
          />
          <path
            stroke="currentColor"
            className="stroke-sidebar-border fill-sidebar translate-y-[0.5px]"
            fill="currentColor"
            shapeRendering="optimizeQuality"
            strokeWidth="1px"
            strokeLinecap="round"
            strokeMiterlimit="10"
            vectorEffect="non-scaling-stroke"
            d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0"
          />{" "}
        </svg>{" "}
        {/* Icons positioned within the SVG decorative area */}
        {/* Rectangle background matching sidebar toggle container */}
        <div
          className={cn(
            "absolute top-0 right-5 z-0 rounded-md p-1 transition-opacity duration-300 ease-in-out",
            "bg-sidebar",
            isCollapsed ? "opacity-100" : "opacity-0",
          )}
          style={{ width: "60px", height: "28px" }}
        />
        <div className="pointer-events-auto absolute top-1 right-6 z-10 flex items-center gap-1.5">
          <button
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
              "hover:bg-sidebar-accent/30 focus:ring-sidebar-ring focus:ring-1 focus:outline-none",
              "text-sidebar-foreground/80 hover:text-sidebar-foreground",
            )}
            aria-label="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={toggleTheme}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
              "hover:bg-sidebar-accent/30 focus:ring-sidebar-ring focus:ring-1 focus:outline-none",
              "text-sidebar-foreground/80 hover:text-sidebar-foreground",
            )}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        {children && (
          <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
