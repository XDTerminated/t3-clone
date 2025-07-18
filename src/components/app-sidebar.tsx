"use client";

import * as React from "react"; // Import React for useEffect, useState
import Image from "next/image";
import { Plus, Search, LogIn, User, Pin, X, Edit2, Share2 } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { useChat } from "~/contexts/ChatContext";
import { DeleteChatDialog } from "~/components/delete-chat-dialog";
import { LogoutDialog } from "~/components/logout-dialog";

// Helper function to group chats by time period
const groupChatsByDate = (
  chats: Array<{
    id: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
    pinned?: boolean;
  }>,
) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Separate pinned and unpinned chats
  const pinnedChats = chats.filter((chat) => chat.pinned);
  const unpinnedChats = chats.filter((chat) => !chat.pinned);

  // Group unpinned chats by date
  const todayChats = unpinnedChats.filter((chat) => {
    const chatDate = new Date(chat.updatedAt);
    return chatDate >= today;
  });

  const yesterdayChats = unpinnedChats.filter((chat) => {
    const chatDate = new Date(chat.updatedAt);
    return chatDate >= yesterday && chatDate < today;
  });

  const last30DaysChats = unpinnedChats.filter((chat) => {
    const chatDate = new Date(chat.updatedAt);
    return chatDate >= thirtyDaysAgo && chatDate < yesterday;
  });

  const olderChats = unpinnedChats.filter((chat) => {
    const chatDate = new Date(chat.updatedAt);
    return chatDate < thirtyDaysAgo;
  });

  return {
    pinned: pinnedChats,
    today: todayChats,
    yesterday: yesterdayChats,
    last30Days: last30DaysChats,
    older: olderChats,
  };
};

// Chat item component with hover actions
const ChatItem = ({
  chat,
  onSelect,
  onPin,
  onRename,
  onDelete,
  onShare,
  isActive = false,
}: {
  chat: { id: string; title: string | null; pinned?: boolean };
  onSelect: (id: string) => void;
  onPin: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string, title: string | null) => void;
  onShare: (id: string) => void;
  isActive?: boolean;
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(chat.title ?? "New Chat");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const newTitle = editTitle.trim();
    if (newTitle && newTitle !== (chat.title ?? "New Chat")) {
      onRename(chat.id, newTitle);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditTitle(chat.title ?? "New Chat");
      setIsEditing(false);
    }
  };

  const handleStartEdit = () => {
    setEditTitle(chat.title ?? "New Chat");
    setIsEditing(true);
  };
  return (
    <li className="group/menu-item relative">
      {" "}
      <div
        className={cn(
          "group/link focus-visible:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring relative flex h-9 w-full items-center overflow-hidden rounded-lg px-2 py-1 text-sm outline-none focus-visible:ring-2",
        )}
      >
        {/* Glow effects for active/hover state */}{" "}
        <div
          className={`${
            isActive ? "opacity-100" : "opacity-0 group-hover/link:opacity-100"
          } transition-opacity duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]`}
        >
          <div className="via-sidebar-primary/8 absolute inset-0 bg-gradient-to-r from-transparent to-transparent"></div>
          <div className="via-sidebar-primary/30 absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent"></div>
          <div className="via-sidebar-primary/30 absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent to-transparent"></div>
          <div className="via-sidebar-primary/5 absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 bg-gradient-to-r from-transparent to-transparent blur-sm"></div>
        </div>{" "}
        <div className="relative z-10 flex w-full items-center">
          <button
            className="w-full text-left"
            onClick={() => !isEditing && onSelect(chat.id)}
            disabled={isEditing}
          >
            <div className="relative w-full">
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  className="text-sidebar-foreground w-full border-none bg-transparent px-1 py-1 text-sm outline-none focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <input
                  aria-label="Thread title"
                  aria-readonly="true"
                  readOnly
                  tabIndex={-1}
                  className="hover:truncate-none text-muted-foreground pointer-events-none h-full w-full cursor-pointer truncate overflow-hidden rounded bg-transparent px-1 py-1 text-sm outline-none"
                  title={chat.title ?? "New Chat"}
                  type="text"
                  value={chat.title ?? "New Chat"}
                />
              )}
            </div>
          </button>{" "}
          {/* Hover actions */}{" "}
          <div className="pointer-events-auto absolute top-0 -right-1 bottom-0 z-50 flex h-full translate-x-full items-center justify-end opacity-0 transition-all duration-200 ease-out group-hover/link:translate-x-0 group-hover/link:opacity-100">
            <div className="bg-sidebar/90 border-sidebar-border/30 flex items-center gap-0.5 rounded-md border p-0.5 shadow-sm backdrop-blur-sm">
              <button
                className={cn(
                  "rounded p-1 transition-colors duration-150",
                  chat.pinned
                    ? "text-sidebar-primary hover:bg-sidebar-primary/20"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
                )}
                tabIndex={-1}
                aria-label={chat.pinned ? "Unpin thread" : "Pin thread"}
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(chat.id);
                }}
              >
                <Pin
                  className={cn("size-3.5", chat.pinned && "fill-current")}
                />
              </button>
              <button
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 rounded p-1 transition-colors duration-150"
                tabIndex={-1}
                aria-label="Share thread"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(chat.id);
                }}
              >
                <Share2 className="size-3.5" />
              </button>
              <button
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 rounded p-1 transition-colors duration-150"
                tabIndex={-1}
                aria-label="Rename thread"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit();
                }}
              >
                <Edit2 className="size-3.5" />
              </button>
              <button
                className="text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/20 rounded p-1 transition-colors duration-150"
                tabIndex={-1}
                aria-label="Delete thread"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(chat.id, chat.title);
                }}
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export function AppSidebar() {
  const { isMobile, open, openMobile } = useSidebar();
  const { isSignedIn, isLoaded, signOut } = useAuth();
  // Only fetch user data when signed in to avoid unnecessary API calls
  const { user } = useUser();
  const {
    chats,
    currentChatId,
    startNewChat,
    selectChat,
    deleteChat,
    renameChat,
    pinChat,
    shareChat,
    isLoadingChats,
  } = useChat();
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [chatToDelete, setChatToDelete] = React.useState<{
    id: string;
    title: string | null;
  } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  // Logout dialog state
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");

  // Handler functions
  const handleNewChat = () => {
    startNewChat();
  };

  // Chat manipulation handlers
  const handlePinChat = async (chatId: string) => {
    await pinChat(chatId);
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    void renameChat(chatId, newTitle);
  };

  const handleDeleteChat = (chatId: string, chatTitle: string | null) => {
    setChatToDelete({ id: chatId, title: chatTitle });
    setDeleteDialogOpen(true);
  };
  const handleShareChat = async (chatId: string) => {
    await shareChat(chatId);
  };

  const confirmDelete = async () => {
    if (!chatToDelete) return;

    setIsDeleting(true);
    try {
      await deleteChat(chatToDelete.id);
    } finally {
      setIsDeleting(false);
      setChatToDelete(null);
    }
  };

  // Handle Google sign-in
  const handleSignIn = () => {
    // Navigate directly to Google OAuth using replace for faster navigation
    window.location.replace("/sign-in/google");
  };
  // Handle logout
  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const confirmLogout = async () => {
    await handleSignOut();
  };

  // Filter chats based on search query
  const filterChats = (
    chats: Array<{
      id: string;
      title: string | null;
      createdAt: Date;
      updatedAt: Date;
      pinned?: boolean;
    }>,
  ) => {
    if (!searchQuery.trim()) {
      return chats;
    }

    const query = searchQuery.toLowerCase().trim();
    return chats.filter((chat) => {
      const title = (chat.title ?? "New Chat").toLowerCase();
      return title.includes(query);
    });
  };

  const [sidebarFullyClosed, setSidebarFullyClosed] = React.useState(!open); // Initialize based on initial 'open' state

  // Handle clicking outside user menu to close it
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
          </div>{" "}
          <div className="border-sidebar-border/30 border-b px-3 pb-2">
            <div className="flex items-center">
              <Search className="text-muted-foreground mr-3 -ml-[3px] size-4" />
              <input
                role="searchbox"
                aria-label="Search threads"
                placeholder="Search your threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-foreground placeholder-muted-foreground/50 w-full bg-transparent py-2 text-sm placeholder:select-none focus:outline-none"
              />
            </div>
          </div>
        </SidebarHeader>{" "}
        <SidebarContent className="relative flex min-h-0 flex-1 flex-col gap-0 overflow-auto pb-2">
          {" "}
          {isLoadingChats ? (
            // Show loading indicator when fetching chats
            <div className="text-sidebar-foreground/50 flex flex-col items-center justify-center px-4 py-8 text-center text-sm">
              <div className="border-sidebar-foreground/20 border-t-sidebar-foreground/60 mb-3 h-5 w-5 animate-spin rounded-full border-2"></div>
              <span>Loading conversations...</span>
            </div>
          ) : isSignedIn && chats.length > 0 ? (
            (() => {
              const filteredChats = filterChats(chats);
              const { pinned, today, yesterday, last30Days, older } =
                groupChatsByDate(filteredChats);

              // If search query is active and no results found
              if (searchQuery.trim() && filteredChats.length === 0) {
                return (
                  <div className="text-sidebar-foreground/50 px-4 py-8 text-center text-sm">
                    No chats found matching &ldquo;{searchQuery}&rdquo;
                  </div>
                );
              }

              return (
                <div className="w-full">
                  {/* Pinned chats */}
                  {pinned.length > 0 && (
                    <div className="relative flex w-full min-w-0 flex-col p-2">
                      <div className="ring-sidebar-ring ease-snappy text-muted-foreground flex h-8 shrink-0 items-center rounded-md px-1.5 text-xs font-medium transition-[margin,opacity] duration-200 outline-none select-none focus-visible:ring-2">
                        <Pin className="mr-1.5 size-3" />
                        <span>Pinned</span>
                      </div>{" "}
                      <div className="w-full text-sm">
                        <ul className="flex w-full min-w-0 flex-col gap-1">
                          {" "}
                          {pinned.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              onSelect={selectChat}
                              onPin={handlePinChat}
                              onRename={handleRenameChat}
                              onDelete={handleDeleteChat}
                              onShare={handleShareChat}
                              isActive={currentChatId === chat.id}
                            />
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Today's chats */}
                  {today.length > 0 && (
                    <div className="relative flex w-full min-w-0 flex-col p-2">
                      <div className="ring-sidebar-ring ease-snappy text-muted-foreground flex h-8 shrink-0 items-center rounded-md px-1.5 text-xs font-medium transition-[margin,opacity] duration-200 outline-none select-none focus-visible:ring-2">
                        <span>Today</span>
                      </div>{" "}
                      <div className="w-full text-sm">
                        <ul className="flex w-full min-w-0 flex-col gap-1">
                          {" "}
                          {today.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              onSelect={selectChat}
                              onPin={handlePinChat}
                              onRename={handleRenameChat}
                              onDelete={handleDeleteChat}
                              onShare={handleShareChat}
                              isActive={currentChatId === chat.id}
                            />
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Yesterday's chats */}
                  {yesterday.length > 0 && (
                    <div className="relative flex w-full min-w-0 flex-col p-2">
                      <div className="ring-sidebar-ring ease-snappy text-muted-foreground flex h-8 shrink-0 items-center rounded-md px-1.5 text-xs font-medium transition-[margin,opacity] duration-200 outline-none select-none focus-visible:ring-2">
                        <span>Yesterday</span>
                      </div>{" "}
                      <div className="w-full text-sm">
                        <ul className="flex w-full min-w-0 flex-col gap-1">
                          {" "}
                          {yesterday.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              onSelect={selectChat}
                              onPin={handlePinChat}
                              onRename={handleRenameChat}
                              onDelete={handleDeleteChat}
                              onShare={handleShareChat}
                              isActive={currentChatId === chat.id}
                            />
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Last 30 Days chats */}
                  {last30Days.length > 0 && (
                    <div className="relative flex w-full min-w-0 flex-col p-2">
                      <div className="ring-sidebar-ring ease-snappy text-muted-foreground flex h-8 shrink-0 items-center rounded-md px-1.5 text-xs font-medium transition-[margin,opacity] duration-200 outline-none select-none focus-visible:ring-2">
                        <span>Last 30 Days</span>
                      </div>{" "}
                      <div className="w-full text-sm">
                        <ul className="flex w-full min-w-0 flex-col gap-1">
                          {" "}
                          {last30Days.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              onSelect={selectChat}
                              onPin={handlePinChat}
                              onRename={handleRenameChat}
                              onDelete={handleDeleteChat}
                              onShare={handleShareChat}
                              isActive={currentChatId === chat.id}
                            />
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Older chats */}
                  {older.length > 0 && (
                    <div className="relative flex w-full min-w-0 flex-col p-2">
                      <div className="ring-sidebar-ring ease-snappy text-muted-foreground flex h-8 shrink-0 items-center rounded-md px-1.5 text-xs font-medium transition-[margin,opacity] duration-200 outline-none select-none focus-visible:ring-2">
                        <span>Older</span>
                      </div>{" "}
                      <div className="w-full text-sm">
                        <ul className="flex w-full min-w-0 flex-col gap-1">
                          {" "}
                          {older.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              onSelect={selectChat}
                              onPin={handlePinChat}
                              onRename={handleRenameChat}
                              onDelete={handleDeleteChat}
                              onShare={handleShareChat}
                              isActive={currentChatId === chat.id}
                            />
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : isSignedIn ? (
            <div className="text-sidebar-foreground/50 px-4 py-4 text-center text-sm">
              No chats yet. Start a new conversation!
            </div>
          ) : null}
        </SidebarContent>{" "}
        <div className="m-0 flex flex-col gap-2 p-2 pt-0">
          {isLoaded && isSignedIn ? (
            // User is signed in - show user info with profile picture that opens logout dialog
            <button
              onClick={() => setLogoutDialogOpen(true)}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center gap-4 rounded-lg p-4 transition-colors select-none"
            >
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
            </button>
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
          )}{" "}
        </div>
      </Sidebar>{" "}
      {/* Delete confirmation dialog */}
      <DeleteChatDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        chatTitle={chatToDelete?.title ?? null}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
      {/* Logout confirmation dialog */}
      <LogoutDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={confirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </>
  );
}
