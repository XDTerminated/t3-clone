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

    // forward message to parent
    onSend(message);

    // clear
    const ta = textareaRef.current!;
    ta.value = "";
    messageRef.current = "";
    resizeTextarea();
    setSendDisabled(true);
  };

  // initialize height before paint to avoid layout shift
  useLayoutEffect(() => {
    resizeTextarea();
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-auto fixed inset-x-0 bottom-0 flex justify-center transition-[padding-left] duration-100 ease-in-out", // Added transition classes
        isSidebarOpenDesktop ? "pl-[18rem]" : "",
      )}
    >
      {/* Outer thin border wrapper */}
      <div className="w-full max-w-3xl rounded-t-2xl px-[1px] pt-[1px] ring-1 ring-[#302435]">
        {/* Only top + sides */}
        <div className="w-full max-w-3xl rounded-t-2xl border-x-8 border-t-8 border-[#26202a] bg-gradient-to-b from-[#2c2532] to-[#2b2430] p-3 ring-1 ring-[#3a2532] ring-inset">
          <form className="flex flex-col gap-1" onSubmit={onSubmit}>
            <textarea
              ref={textareaRef}
              name="input"
              id="chat-input"
              placeholder="Type your message here..."
              className="max-h-[200px] min-h-[40px] w-full resize-none overflow-y-auto bg-transparent px-1 text-white outline-none placeholder:text-slate-400"
              aria-label="Message input"
              defaultValue=""
              onInput={onInput}
            />

            <div className="flex items-start justify-between">
              <div className="-ml-2 flex items-center">
                <button
                  className="flex translate-y-1 transform items-center gap-2 rounded-md bg-transparent px-3 py-2 text-slate-300 transition-colors hover:bg-[#332d39] hover:text-slate-100"
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
                    "flex h-9 w-9 items-center justify-center rounded-md border border-[#7f2d52] p-2 text-white", // Added border and border-[#7f2d52]
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
    </div>
  );
}
