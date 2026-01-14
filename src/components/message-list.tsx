import * as React from "react";
import { useChat } from "~/contexts/ChatContext";
import { useModel } from "~/contexts/ModelContext";
import type { UploadFileResponse } from "~/lib/types";
import { MessageWithSyntaxHighlighting } from "./message-with-syntax-highlighting";
import { FileAttachments, ReasoningSection } from "./chat";

export type Message = {
  sender: string;
  text: string;
  files?: UploadFileResponse[];
  reasoning?: string;
};

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const {
    regenerateResponse,
    getMessageAlternativeInfo,
    selectMessageAlternative,
    isMessageNavigable,
    isGeneratingResponse,
  } = useChat();

  const { selectedModel } = useModel();

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [copiedStates, setCopiedStates] = React.useState<
    Record<number, boolean>
  >({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]); // Copy functionality with visual feedback
  const handleCopy = async (
    text: string,
    messageIndex: number,
    files?: UploadFileResponse[],
  ) => {
    try {
      // For messages with generated images, prioritize the image URL
      if (files && files.length > 0) {
        const imageFile = files.find((file) => {
          const fileType = (file.serverData as { type: string })?.type ?? "";
          return fileType.startsWith("image/");
        });

        if (imageFile) {
          // Copy the image URL for generated images
          await navigator.clipboard.writeText(imageFile.url);
          setCopiedStates((prev) => ({ ...prev, [messageIndex]: true }));
          setTimeout(() => {
            setCopiedStates((prev) => ({ ...prev, [messageIndex]: false }));
          }, 2000);
          return;
        }
      }

      // Default behavior: copy text content
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [messageIndex]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [messageIndex]: false }));
      }, 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Helper function to get copy button label based on message content
  const getCopyLabel = (msg: Message) => {
    if (msg.files && msg.files.length > 0) {
      const hasImage = msg.files.some((file) => {
        const fileType = (file.serverData as { type: string })?.type ?? "";
        return fileType.startsWith("image/");
      });
      if (hasImage) {
        return msg.sender === "AI"
          ? "Copy generated image URL"
          : "Copy image URL";
      }
    }
    return msg.sender === "AI"
      ? "Copy response to clipboard"
      : "Copy message to clipboard";
  };
  return (
    <div
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      className="pt-safe-offset-10 mx-auto flex w-full max-w-3xl flex-col space-y-16 px-4 pt-12 pb-40"
    >
      {messages.map((msg: Message, idx: number) => (
        <div
          key={idx}
          data-message-id={`${idx}`}
          className={`flex ${msg.sender === "User" ? "justify-end" : "justify-start"}`}
        >
          {" "}
          {msg.sender === "User" ? (
            <div
              role="article"
              aria-label="Your message"
              className="group theme-user-message relative inline-block max-w-[80%] rounded-xl border px-4 py-3 text-left break-words backdrop-blur-sm"
            >
              <span className="sr-only">Your message: </span>{" "}
              <div className="flex flex-col">
                {" "}
                <div className="prose dark:prose-invert max-w-none leading-relaxed [&_ol:last-child]:mb-0 [&_p:last-child]:mb-0 [&_ul:last-child]:mb-0">
                  <MessageWithSyntaxHighlighting text={msg.text} />
                </div>
                {msg.files && msg.files.length > 0 && (
                  <FileAttachments files={msg.files} />
                )}
              </div>{" "}
              {/* Copy button for user messages */}
              <div className="absolute right-0 mt-5 -mr-0.5 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100">
                {" "}
                <button
                  onClick={() => handleCopy(msg.text, idx, msg.files)}
                  className="focus-visible:ring-ring hover:text-foreground disabled:hover:text-foreground/50 hover:bg-muted-foreground/10 inline-flex h-8 w-8 items-center justify-center gap-2 rounded-lg p-0 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  aria-label={getCopyLabel(msg)}
                  data-state="closed"
                >
                  <div className="relative size-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`lucide lucide-copy ease-snappy absolute inset-0 transition-all duration-200 ${
                        copiedStates[idx]
                          ? "scale-0 opacity-0"
                          : "scale-100 opacity-100"
                      }`}
                      aria-hidden="true"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`lucide lucide-check ease-snappy absolute inset-0 transition-all duration-200 ${
                        copiedStates[idx]
                          ? "scale-100 opacity-100"
                          : "scale-0 opacity-0"
                      }`}
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="group relative w-full max-w-full break-words">
              {" "}
              {msg.reasoning && (
                <ReasoningSection reasoning={msg.reasoning} />
              )}{" "}
              {/* Show typing indicator for empty AI messages when generating, otherwise show the message */}
              {isGeneratingResponse && !msg.text.trim() ? (
                <div
                  role="article"
                  aria-label="Assistant is thinking"
                  className="prose dark:prose-invert animate-fadeIn max-w-none leading-relaxed opacity-100"
                >
                  <div className="flex items-center space-x-1 py-2">
                    <div className="flex space-x-1">
                      <div className="typing-dot h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                      <div className="typing-dot h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                      <div className="typing-dot h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div
                    role="article"
                    aria-label="Assistant message"
                    className="prose dark:prose-invert animate-fadeIn max-w-none leading-relaxed opacity-0"
                  >
                    {" "}
                    <span className="sr-only">Assistant Reply: </span>
                    <MessageWithSyntaxHighlighting text={msg.text} />
                  </div>
                  {/* Show generated images or other files from AI */}
                  {msg.files && msg.files.length > 0 && (
                    <FileAttachments files={msg.files} />
                  )}
                </div>
              )}
              <div className="absolute left-0 mt-5 -ml-0.5 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100">
                {" "}
                <button
                  onClick={() => handleCopy(msg.text, idx, msg.files)}
                  className="focus-visible:ring-ring hover:text-foreground disabled:hover:text-foreground/50 hover:bg-muted-foreground/10 inline-flex h-8 w-8 items-center justify-center gap-2 rounded-lg p-0 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  aria-label={getCopyLabel(msg)}
                  data-state="closed"
                >
                  <div className="relative size-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`lucide lucide-copy ease-snappy absolute inset-0 transition-all duration-200 ${
                        copiedStates[idx]
                          ? "scale-0 opacity-0"
                          : "scale-100 opacity-100"
                      }`}
                      aria-hidden="true"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`lucide lucide-check ease-snappy absolute inset-0 transition-all duration-200 ${
                        copiedStates[idx]
                          ? "scale-100 opacity-100"
                          : "scale-0 opacity-0"
                      }`}
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>{" "}
                </button>{" "}
                {/* Only show regenerate button for non-image generation models */}
                {!selectedModel.capabilities?.includes("image") && (
                  <button
                    aria-label="Regenerate response"
                    onClick={() => regenerateResponse(idx - 1)}
                    className="focus-visible:ring-ring hover:text-foreground disabled:hover:text-foreground/50 hover:bg-muted-foreground/10 inline-flex h-8 w-8 items-center justify-center gap-2 rounded-lg p-0 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                    data-action="retry"
                    data-state="closed"
                  >
                    {/* retry icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M16 16h5v5" />
                    </svg>
                  </button>
                )}{" "}
              </div>{" "}
              {/* Message-level alternative navigation controls - show for AI messages that have alternatives */}
              {msg.sender === "AI" &&
                (() => {
                  const alternativeInfo = getMessageAlternativeInfo(idx);
                  const isNavigable = isMessageNavigable(idx);

                  // Only show navigation if the message has alternatives AND is navigable
                  if (!alternativeInfo || !isNavigable) return null;

                  const handlePrevAlternative = () => {
                    const newIndex = alternativeInfo.current - 2; // Convert to 0-based and go to previous
                    if (newIndex >= 0) {
                      selectMessageAlternative(idx, newIndex);
                    }
                  };

                  const handleNextAlternative = () => {
                    const newIndex = alternativeInfo.current; // Current is 1-based, so this is next in 0-based
                    if (newIndex < alternativeInfo.total) {
                      selectMessageAlternative(idx, newIndex);
                    }
                  };

                  return (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      {" "}
                      <button
                        onClick={handlePrevAlternative}
                        disabled={alternativeInfo.current <= 1}
                        className="focus-visible:ring-ring hover:text-foreground disabled:hover:text-foreground/50 hover:bg-muted-foreground/10 inline-flex h-8 w-8 items-center justify-center gap-2 rounded-lg p-0 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                        aria-label="Previous alternative"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                      <span className="text-muted-foreground bg-muted/50 rounded px-2 py-1 text-sm">
                        {alternativeInfo.current} / {alternativeInfo.total}
                      </span>{" "}
                      <button
                        onClick={handleNextAlternative}
                        disabled={
                          alternativeInfo.current >= alternativeInfo.total
                        }
                        className="focus-visible:ring-ring hover:text-foreground disabled:hover:text-foreground/50 hover:bg-muted-foreground/10 inline-flex h-8 w-8 items-center justify-center gap-2 rounded-lg p-0 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                        aria-label="Next alternative"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  );
                })()}
            </div>
          )}
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
