"use client";

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

// Mock data based on the image
const last30DaysThreads = [{ title: "What\\'s up", id: "1" }];

const olderThreads = [
  { title: "Greeting a friend", id: "2" },
  { title: "Invert Binary Search Tree in P...", id: "3" },
  { title: "Chess engine vs Stockfish lib...", id: "4" },
  { title: "Understanding trpc and its fu...", id: "5" },
  { title: "Refactoring Code to Separate...", id: "6" },
  { title: "Creating a FastAPI Langchain...", id: "7" },
];

const staticLinks = [
  { title: "Welcome to T3 Chat", id: "sl1" },
  { title: "Why T3 Chat?", id: "sl2" },
  { title: "FAQ", id: "sl3" },
];

export function AppSidebar() {
  const { isMobile } = useSidebar(); // Get mobile state

  return (
    <>
      {!isMobile && (
        // Desktop-only trigger that stays fixed
        <SidebarTrigger className="text-sidebar-foreground absolute top-4 left-4 z-20 hidden md:flex" />
      )}
      <Sidebar className="border-sidebar-border bg-sidebar text-sidebar-foreground flex h-screen w-72 flex-col border-r">
        <SidebarHeader className="border-sidebar-border relative flex h-16 items-center justify-center border-b p-4">
          {isMobile && (
            // Original trigger, now only for mobile
            <SidebarTrigger className="text-sidebar-foreground absolute left-4" />
          )}
          <h2 className="text-sidebar-foreground text-xl font-semibold">
            AnyGraph
          </h2>
        </SidebarHeader>

        <SidebarContent className="scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent flex-grow space-y-1 overflow-y-auto px-2">
          <SidebarMenu className="px-2">
            <SidebarMenuItem className="text-muted-foreground px-2 pt-2 pb-1 text-xs select-none">
              Last 30 Days
            </SidebarMenuItem>
            {last30DaysThreads.map((thread) => (
              <SidebarMenuItem key={thread.id} className="py-0.5">
                <SidebarMenuButton
                  variant="default"
                  className="hover:bg-sidebar-accent text-sidebar-foreground h-8 w-full justify-start bg-transparent px-2 text-sm"
                >
                  {thread.title}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          <SidebarMenu className="px-2">
            <SidebarMenuItem className="text-muted-foreground px-2 pt-2 pb-1 text-xs select-none">
              Older
            </SidebarMenuItem>
            {olderThreads.map((thread) => (
              <SidebarMenuItem key={thread.id} className="py-0.5">
                <SidebarMenuButton
                  variant="default"
                  className="hover:bg-sidebar-accent text-sidebar-foreground h-8 w-full justify-start bg-transparent px-2 text-sm"
                >
                  {thread.title}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          <div className="px-2">
            <Separator className="bg-sidebar-border my-3" />
          </div>

          <SidebarMenu className="px-2">
            {staticLinks.map((link) => (
              <SidebarMenuItem key={link.id} className="py-0.5">
                <SidebarMenuButton
                  variant="default"
                  className="hover:bg-sidebar-accent text-sidebar-foreground h-8 w-full justify-start bg-transparent px-2 text-sm"
                >
                  {link.title}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
