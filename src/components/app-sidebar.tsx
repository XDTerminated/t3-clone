"use client";

import * as React from "react"; // Import React for useEffect, useState
import { useRef } from "react";
import { Plus } from "lucide-react";
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
import { Separator } from "~/components/ui/separator";
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
  const handleInsertClick = () => fileInputRef.current?.click();
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
      <div
        className={cn(
          "absolute top-3 left-4 z-20 flex items-center rounded-md p-1", // Changed top-4 to top-3
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
      </div>
      <Sidebar className="bg-sidebar text-sidebar-foreground flex h-screen w-72 flex-col">
        <SidebarHeader className="relative flex h-32 flex-col items-center justify-center p-4">
          {/* Changed items-start to items-center and specific padding to p-4 */}
          <h2 className="text-sidebar-foreground mb-2 text-xl font-semibold">
            AnyGraph
          </h2>
          <SidebarMenuButton
            variant="default"
            className="justify-center rounded-sm border border-[#7e2b4f] bg-[#3d1328] px-4 py-3.5 text-sm text-white hover:bg-[#4f1933] active:bg-[#5a1d3a]"
            onClick={handleInsertClick}
          >
            Insert New File
          </SidebarMenuButton>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="w-full pt-4">
            {" "}
            {/* Changed from w-65 to w-full */}
            <Separator className="bg-sidebar-border" />
          </div>
        </SidebarHeader>

        <SidebarContent className="scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent flex-grow space-y-1 overflow-y-auto px-2">
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
      </Sidebar>
    </>
  );
}
