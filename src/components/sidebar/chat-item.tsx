"use client";

import * as React from "react";
import { Pin, X, Edit2, Share2 } from "lucide-react";
import { cn } from "~/lib/utils";

export interface ChatItemProps {
  chat: { id: string; title: string | null; pinned?: boolean };
  onSelect: (id: string) => void;
  onPin: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string, title: string | null) => void;
  onShare: (id: string) => void;
  isActive?: boolean;
}

export function ChatItem({
  chat,
  onSelect,
  onPin,
  onRename,
  onDelete,
  onShare,
  isActive = false,
}: ChatItemProps) {
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
}
