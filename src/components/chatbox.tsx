"use client";

import { ChevronDown, ArrowUp } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useSidebar } from "~/components/ui/sidebar";
import { useState, useRef, useEffect } from "react";

const INITIAL_TEXTAREA_HEIGHT = 48;

export function Chatbox() {
  const sidebar = useSidebar();
  const isSidebarOpenDesktop = sidebar
    ? sidebar.open && !sidebar.isMobile
    : false;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState("");

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = `${INITIAL_TEXTAREA_HEIGHT}px`;
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [message]);

  return (
    <div
      className={cn(
        "pointer-events-auto fixed inset-x-0 bottom-0 flex justify-center",
        isSidebarOpenDesktop ? "pl-[18rem]" : "",
      )}
    >
      {/* Only top + sides */}
      <div className="w-full max-w-3xl rounded-t-xl border-x-6 border-t-6 border-[#26202a] bg-[#2c2532] p-3">
        <form className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            name="input"
            id="chat-input"
            placeholder="Type your message here..."
            className="w-full resize-none bg-transparent text-white outline-none placeholder:text-slate-400"
            aria-label="Message input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ height: `${INITIAL_TEXTAREA_HEIGHT}px` }}
          />

          <div className="flex items-center justify-between">
            {/* Left: model dropdown + search */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-slate-100"
              >
                <span className="text-sm font-medium">Gemini 2.5 Flash</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Right: attach + send */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                aria-label="Send message"
                disabled={!message.trim()}
                className={cn(
                  "rounded-md p-2 text-white",
                  message.trim()
                    ? "bg-[#451e35] hover:bg-[#7e1c48]"
                    : "bg-[#3a2134] hover:bg-[#4f2c46]",
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
