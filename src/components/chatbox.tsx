"use client";

import { ChevronDown, ArrowUp } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useSidebar } from "~/components/ui/sidebar";
import { useRef, useState, useLayoutEffect } from "react";

const INITIAL_TEXTAREA_HEIGHT = 40; // slightly reduced initial textarea height

export function Chatbox({ onSend }: { onSend: (message: string) => void }) {
  const sidebar = useSidebar();
  const isSidebarOpenDesktop = sidebar
    ? sidebar.open && !sidebar.isMobile
    : false;

  const sidebarWidth = sidebar?.width || 256;
  const isResizing = sidebar?.isResizing || false;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageRef = useRef("");
  const [sendDisabled, setSendDisabled] = useState(true);

  // Only adjust height (no component re-render)
  const resizeTextarea = () => {
    const ta = textareaRef.current!;
    ta.style.height = "auto";
    const newHeight = Math.max(ta.scrollHeight, INITIAL_TEXTAREA_HEIGHT);
    ta.style.height = `${newHeight}px`;
  };

  // handle every keystroke without full re-render
  const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const text = (e.currentTarget as HTMLTextAreaElement).value;
    messageRef.current = text;
    resizeTextarea();

    const isEmpty = text.trim().length === 0;
    // only trigger state change (and thus re-render) if disabled status actually flips
    if (isEmpty !== sendDisabled) {
      setSendDisabled(isEmpty);
    }
  };

  // New function to handle the core message sending logic
  const handleSendMessage = () => {
    const message = messageRef.current.trim();
    if (!message) return;

    // forward message to parent
    onSend(message);

    // clear
    const ta = textareaRef.current!;
    ta.value = "";
    messageRef.current = "";
    resizeTextarea();
    setSendDisabled(true);
  };

  // When you send, read from messageRef, then reset DOM + state
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(); // Call the new handler
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline in textarea
      if (!sendDisabled) {
        handleSendMessage(); // Call the new handler
      }
    }
  };

  // initialize height before paint to avoid layout shift
  useLayoutEffect(() => {
    resizeTextarea();
  }, []);
  return (
    <div
      className={cn(
        "pointer-events-auto fixed inset-x-0 bottom-0 flex justify-center",
        // Add smooth transition for positioning, but disable during resizing for performance
        !isResizing && "transition-all duration-100 ease-linear",
      )}
      style={{
        paddingLeft: isSidebarOpenDesktop ? `${sidebarWidth}px` : "0px",
        transition: isResizing ? "none" : undefined,
      }}
    >
      {" "}
      {/* Outer thin border wrapper */}
      <div className="ring-border/30 w-full max-w-3xl rounded-t-2xl px-[1px] pt-[1px] ring-1">
        {/* Only top + sides */}
        <div className="border-card from-card/80 to-card ring-border w-full max-w-3xl rounded-t-2xl border-x-8 border-t-8 bg-gradient-to-b p-3 shadow-lg ring-1 backdrop-blur-sm ring-inset">
          <form className="flex flex-col gap-1" onSubmit={onSubmit}>
            <textarea
              ref={textareaRef}
              name="input"
              id="chat-input"
              placeholder="Type your message here..."
              className="text-foreground placeholder:text-muted-foreground max-h-[200px] min-h-[40px] w-full resize-none overflow-y-auto bg-transparent px-1 outline-none"
              aria-label="Message input"
              defaultValue=""
              onInput={onInput}
              onKeyDown={handleKeyDown}
            />{" "}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  className="text-secondary-foreground hover:bg-secondary/50 active:bg-secondary/70 flex items-center gap-2 rounded-lg bg-transparent px-3 py-2 transition-colors"
                  type="button"
                >
                  <span className="text-sm font-medium">Gemini 2.5 Flash</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              {/* Right: send button */}
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  aria-label="Send message"
                  disabled={sendDisabled}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border p-2",
                    sendDisabled
                      ? "bg-secondary/30 text-secondary-foreground/50 border-secondary/20 hover:bg-secondary/40"
                      : "bg-primary text-primary-foreground border-primary/20 hover:bg-primary/90 active:bg-primary/80",
                  )}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
