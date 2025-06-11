"use client";

import * as React from "react"; // Import React for useEffect, useState
import Image from "next/image";
import { Plus, Search, LogIn, User, MessageSquare } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
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
import { useChat } from "~/contexts/ChatContext";

export function AppSidebar() {
  const { isMobile, open, openMobile } = useSidebar();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();  const { chats, startNewChat, selectChat, currentChatId } = useChat();

  const handleNewChat = () => {
    startNewChat();
  };// Handle Google sign-in
  const handleSignIn = () => {
    // Navigate directly to Google OAuth
    window.location.href = "/sign-in/google";
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
          "fixed top-2 left-2 z-20 flex items-center rounded-md p-1",
          darkBgState ? "bg-sidebar" : "",
        )}
      >
        <SidebarTrigger
          className={cn(
            "rounded-lg !bg-transparent transition-colors",
            "hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground",
            darkBgState
              ? "text-sidebar-foreground bg-transparent"
              : "text-sidebar-foreground",
          )}
        />
        <button
          aria-label="New chat"
          onClick={handleNewChat}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "size-7",
            "flex items-center justify-center",
            "overflow-hidden transition-all duration-100 ease-linear",
            "hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground",
            darkBgState ? "text-sidebar-foreground" : "text-sidebar-foreground",
            shouldShowPlusButton
              ? "ml-2 w-7 opacity-100"
              : "ml-0 w-0 opacity-0",
          )}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <Sidebar className="text-sidebar-foreground flex h-screen flex-col bg-gradient-to-tl from-neutral-900 via-neutral-800 to-neutral-700">
        <SidebarHeader className="relative m-2 mb-0 flex flex-col gap-2 space-y-2 p-0">
          <h1 className="text-muted-foreground flex h-8 shrink-0 items-center justify-center text-lg transition-opacity delay-75 duration-100">
            <div className="text-foreground relative flex h-8 w-24 items-center justify-center text-sm font-semibold">
              <div className="h-3.5 select-none">T3 Clone</div>
            </div>
          </h1>{" "}
          <div className="px-1">
            <button
              className="new-chat-button focus-visible:ring-ring inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold whitespace-nowrap shadow transition-colors select-none focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleNewChat}
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
        </SidebarHeader>{" "}
        <SidebarContent className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-auto pb-2">
          <SidebarMenu className="px-2">
            {chats.map((chat) => (
              <SidebarMenuItem key={chat.id} className="py-0.5">
                <SidebarMenuButton
                  variant="default"
                  className={cn(
                    "hover:bg-sidebar-accent text-sidebar-foreground h-8 w-full justify-start bg-transparent px-2 text-sm",
                    currentChatId === chat.id && "bg-sidebar-accent",
                  )}
                  onClick={() => selectChat(chat.id)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span className="truncate">{chat.title ?? "New Chat"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {chats.length === 0 && isSignedIn && (
              <div className="text-sidebar-foreground/50 py-4 text-center text-sm">
                No chats yet. Start a new conversation!
              </div>
            )}
          </SidebarMenu>
        </SidebarContent>{" "}
        <div className="m-0 flex flex-col gap-2 p-2 pt-0">
          {isLoaded && isSignedIn ? (
            // User is signed in - show user info with profile picture
            <div className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center gap-4 rounded-lg p-4 transition-colors select-none">
              {" "}
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Profile"
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <User className="size-6" />
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {user?.fullName ??
                    user?.emailAddresses?.[0]?.emailAddress ??
                    "User"}
                </span>
                <span className="text-sidebar-foreground/70 truncate text-xs">
                  {user?.emailAddresses?.[0]?.emailAddress}
                </span>
              </div>
            </div>
          ) : (
            // User is not signed in - show login button
            <button
              onClick={handleSignIn}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent/80 flex w-full items-center gap-4 rounded-lg p-4 transition-colors select-none"
              disabled={!isLoaded}
            >
              <LogIn className="size-4" />
              <span>{isLoaded ? "Login with Google" : "Loading..."}</span>
            </button>
          )}
        </div>
      </Sidebar>
    </>
  );
}
