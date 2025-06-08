"use client";

import * as React from "react"; // Import React for useEffect, useState
import { useRef } from "react";
import { Plus, Search, LogIn } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { parse } from "papaparse";
import { useData, type Dataset } from "~/contexts/DataContext";

export function AppSidebar() {
  const { isMobile, open, openMobile } = useSidebar();
  // retrieve data context values
  const dataContext = useData();
  const { datasets, selectDataset, addDataset } = dataContext;
  // file input for direct uploads
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleInsertClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      parse<Record<string, string>>(csv, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => addDataset(file.name, res.data),
      });
    };
    reader.readAsText(file);
  };

  const [sidebarFullyClosed, setSidebarFullyClosed] = React.useState(!open); // Initialize based on initial 'open' state

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isMobile) {
      if (!open) {
        // Sidebar is closing or closed
        timer = setTimeout(() => {
          setSidebarFullyClosed(true);
        }, 100); // Delay matches sidebar animation (duration-100)
      } else {
        // Sidebar is opening or open
        setSidebarFullyClosed(false);
      }
    } else {
      // On mobile, this state isn't used for the plus button's primary logic, reset if needed
      setSidebarFullyClosed(false);
    }

    return () => clearTimeout(timer); // Cleanup timer on unmount or if dependencies change
  }, [open, isMobile]);

  const darkBgState = isMobile ? !openMobile : !open;
  // Updated logic for shouldShowPlusButton
  const shouldShowPlusButton =
    (sidebarFullyClosed && !isMobile && !open) || isMobile; // Changed (openMobile && isMobile) to isMobile

  return (
    <>
      {/* Hidden file input always mounted */}
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />{" "}
      <div
        className={cn(
          "fixed top-2 left-2 z-20 flex items-center rounded-md p-1",
          darkBgState ? "bg-neutral-800" : "",
        )}
      >
        <SidebarTrigger
          className={cn(
            "rounded-md",
            darkBgState
              ? "bg-transparent text-white hover:bg-neutral-700 hover:text-white"
              : "text-sidebar-foreground",
          )}
        />
        <button
          aria-label="Insert new file"
          onClick={handleInsertClick}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "size-7",
            "flex items-center justify-center",
            "overflow-hidden transition-all duration-300 ease-in-out",
            darkBgState
              ? "text-white hover:bg-neutral-700 hover:text-white"
              : "text-sidebar-foreground",
            shouldShowPlusButton
              ? "ml-2 w-7 opacity-100"
              : "ml-0 w-0 opacity-0",
          )}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>{" "}
      <Sidebar className="text-sidebar-foreground flex h-screen flex-col bg-gradient-to-tl from-neutral-900 via-neutral-800 to-neutral-700">
        <SidebarHeader className="relative m-2 mb-0 flex flex-col gap-2 space-y-2 p-0">
          <h1 className="text-muted-foreground flex h-8 shrink-0 items-center justify-center text-lg transition-opacity delay-75 duration-75">
            <div className="text-foreground relative flex h-8 w-24 items-center justify-center text-sm font-semibold">
              <div className="h-3.5 select-none">T3 Clone</div>
            </div>
          </h1>
          <div className="px-1">
            <button
              className="focus-visible:ring-ring inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-pink-600/30 bg-pink-800/20 p-2 px-4 py-2 text-sm font-semibold whitespace-nowrap text-pink-100 shadow transition-colors select-none hover:bg-pink-700/30 focus-visible:ring-1 focus-visible:outline-none active:bg-pink-800/40 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleInsertClick}
            >
              <span className="w-full text-center select-none">New Chat</span>
            </button>
          </div>
          <div className="border-sidebar-border/30 border-b px-3 pb-2">
            <div className="flex items-center">
              <Search className="text-muted-foreground mr-3 -ml-[3px] size-4" />
              <input
                role="searchbox"
                aria-label="Search threads"
                placeholder="Search your threads..."
                className="text-foreground placeholder-muted-foreground/50 w-full bg-transparent py-2 text-sm placeholder:select-none focus:outline-none"
              />
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-auto pb-2">
          <SidebarMenu className="px-2">
            {datasets.map((ds: Dataset, idx: number) => (
              <SidebarMenuItem key={`${ds.name}-${idx}`} className="py-0.5">
                <SidebarMenuButton
                  variant="default"
                  className="hover:bg-sidebar-accent text-sidebar-foreground h-8 w-full justify-start bg-transparent px-2 text-sm"
                  onClick={() => selectDataset(idx)}
                >
                  {ds.name}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <div className="m-0 flex flex-col gap-2 p-2 pt-0">
          <button className="text-muted-foreground hover:bg-sidebar-accent flex w-full items-center gap-4 rounded-lg p-4 select-none">
            <LogIn className="size-4" />
            <span>Login</span>
          </button>
        </div>
      </Sidebar>
    </>
  );
}
