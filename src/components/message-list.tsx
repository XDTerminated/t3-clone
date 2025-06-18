import * as React from "react";
import { useChat } from "~/contexts/ChatContext";
import { useModel } from "~/contexts/ModelContext";
import {
  Image as ImageIcon,
  FileText,
  Paperclip,
  Eye,
  Download,
  ChevronDown,
} from "lucide-react";
import NextImage from "next/image";
import { useState } from "react";
import type { UploadFileResponse } from "~/lib/types";
import { MessageWithSyntaxHighlighting } from "./message-with-syntax-highlighting";

export type Message = {
  sender: string;
  text: string;
  files?: UploadFileResponse[];
  reasoning?: string;
};

interface MessageListProps {
  messages: Message[];
}

// Component to display reasoning section
function ReasoningSection({ reasoning }: { reasoning: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!reasoning?.trim()) {
    return null;
  }

  return (
    <div className="model-thoughts mb-4">
      <div className="thoughts-header">
        {" "}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="thoughts-header-button flex items-center gap-1 rounded border-0 bg-transparent p-0 transition-opacity duration-200 ease-out hover:opacity-70 focus:outline-none"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Hide thinking" : "Show thinking"}
        >
          <span className="text-sm font-medium text-gray-600 select-none dark:text-gray-400">
            Show thinking
          </span>
          <div
            className={`transition-transform duration-200 ease-out ${isExpanded ? "rotate-180" : ""}`}
          >
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
        </button>
      </div>
      <div
        className={`thoughts-content overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="message-container mt-2 pl-4">
          <div className="markdown markdown-main-panel stronger prose dark:prose-invert max-w-none text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            <MessageWithSyntaxHighlighting text={reasoning} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Component to display file attachments
function FileAttachments({ files }: { files: UploadFileResponse[] }) {
  const [selectedFile, setSelectedFile] = useState<UploadFileResponse | null>(
    null,
  );

  const downloadFile = (file: UploadFileResponse) => {
    // Open in a new tab, letting the browser handle download/display
    window.open(file.url, "_blank", "noopener,noreferrer");
  };

  const viewFile = (file: UploadFileResponse) => {
    const fileType = (file.serverData as { type: string })?.type ?? "";
    if (fileType.startsWith("image/")) {
      setSelectedFile(file);
    } else {
      // For PDFs and other types, open in a new tab
      window.open(file.url, "_blank", "noopener,noreferrer");
    }
  };

  // Check if this is a generated image (base64 data URL or has "generated" in name)
  const isGeneratedImage = (file: UploadFileResponse) => {
    const fileType = (file.serverData as { type: string })?.type ?? "";
    return (
      fileType.startsWith("image/") &&
      (file.url.startsWith("data:image/") ||
        file.name.toLowerCase().includes("generated"))
    );
  };

  // Separate generated images from other files
  const generatedImages = files.filter(isGeneratedImage);
  const otherFiles = files.filter((file) => !isGeneratedImage(file));

  return (
    <>
      {/* Display generated images directly */}
      {generatedImages.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {generatedImages.map((file, index) => (
            <div key={`generated-${index}`} className="group relative">
              <NextImage
                src={file.url}
                alt={file.name}
                width={512}
                height={512}
                className="h-auto max-w-full cursor-pointer rounded-lg border object-contain transition-opacity hover:opacity-90"
                loading="lazy"
                onClick={() => setSelectedFile(file)}
              />
              {/* Overlay buttons on hover */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => viewFile(file)}
                  className="rounded bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                  title="View full size"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => downloadFile(file)}
                  className="rounded bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                  title="Download image"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Display other files as before */}
      {otherFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {otherFiles.map((file, index) => {
            const fileType =
              (file.serverData as { type: string })?.type ??
              "application/octet-stream";
            const isImage = fileType.startsWith("image/");
            const isPDF = fileType === "application/pdf";

            return (
              <div
                key={index}
                className="bg-secondary/10 hover:bg-secondary/20 border-secondary/20 group flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                onClick={() => viewFile(file)}
              >
                <div className="flex items-center gap-2">
                  {isImage ? (
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                  ) : isPDF ? (
                    <FileText className="h-4 w-4 text-red-500" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="max-w-[150px] truncate font-medium">
                    {file.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewFile(file);
                    }}
                    className="hover:bg-secondary/40 rounded p-1 transition-colors"
                    title="View file"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(file);
                    }}
                    className="hover:bg-secondary/40 rounded p-1 transition-colors"
                    title="Download file"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image preview modal */}
      {selectedFile &&
        ((selectedFile.serverData as { type: string })?.type ?? "").startsWith(
          "image/",
        ) && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedFile(null)}
          >
            <div className="bg-background max-h-[90vh] max-w-4xl overflow-auto rounded-lg p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedFile.name}</h3>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="hover:bg-secondary/40 rounded p-2 transition-colors"
                >
                  ×
                </button>
              </div>
              <NextImage
                src={selectedFile.url}
                alt={selectedFile.name}
                width={800}
                height={600}
                className="h-auto max-w-full rounded border object-contain"
                loading="lazy"
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => downloadFile(selectedFile)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded px-3 py-2 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>{" "}
              </div>
            </div>
          </div>
        )}
    </>
  );
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
              className="group border-secondary/50 bg-muted relative inline-block max-w-[80%] rounded-xl border px-4 py-3 text-left break-words"
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
