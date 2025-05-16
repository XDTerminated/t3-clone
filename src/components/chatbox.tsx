"use client";

import { ChevronDown, ArrowUp } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useSidebar } from "~/components/ui/sidebar";
import { useRef, useState, useEffect } from "react";

const INITIAL_TEXTAREA_HEIGHT = 48;

export function Chatbox() {
  const sidebar = useSidebar();
  const isSidebarOpenDesktop = sidebar
    ? sidebar.open && !sidebar.isMobile
    : false;

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

  // When you send, read from messageRef, then reset DOM + state
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = messageRef.current.trim();
    if (!message) return;

    // … your send logic here …
    console.log("sending:", message);

    // clear
    const ta = textareaRef.current!;
    ta.value = "";
    messageRef.current = "";
    resizeTextarea();
    setSendDisabled(true);
  };

  // initialize height once
  useEffect(() => {
    resizeTextarea();
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-auto fixed inset-x-0 bottom-0 flex justify-center transition-[padding-left] duration-100 ease-in-out", // Added transition classes
        isSidebarOpenDesktop ? "pl-[18rem]" : "",
      )}
    >
      {/* Only top + sides */}
      <div className="w-full max-w-3xl rounded-t-xl border-x-8 border-t-8 border-[#26202a] bg-[#2c2532] p-4"> {/* Increased padding and border size */}
        <form className="flex flex-col gap-2" onSubmit={onSubmit}>
          <textarea
            ref={textareaRef}
            name="input"
            id="chat-input"
            placeholder="Type your message here..."
            className="w-full resize-none bg-transparent text-white outline-none placeholder:text-slate-400"
            aria-label="Message input"
            defaultValue=""
            onInput={onInput}
            style={{ height: `${INITIAL_TEXTAREA_HEIGHT}px` }}
          />

          <div className="flex items-end justify-between"> {/* Changed items-center to items-end */}
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

            {/* Right: send button */}
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                aria-label="Send message"
                disabled={sendDisabled}
                className={cn(
                  "rounded-md p-2 text-white h-9 w-9 flex items-center justify-center border border-[#7f2d52]", // Added border and border-[#7f2d52]
                  sendDisabled
                    ? "bg-[#3a2134] hover:bg-[#4f2c46]"
                    : "bg-[#451e35] hover:bg-[#7e1c48]",
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
