"use client";

import {
  ArrowUp,
  Globe,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Key,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { useSidebar } from "~/components/ui/sidebar";
import { useRef, useState, useLayoutEffect, useEffect } from "react";
import { ModelSelector } from "./model-selector";
import { useModel } from "~/contexts/ModelContext";
import { useApiKey } from "~/contexts/ApiKeyContext";
import { useAuth } from "@clerk/nextjs";
import { useChat } from "~/contexts/ChatContext";
import { useUploadThing } from "~/lib/uploadthing";
import type { UploadFileResponse, ChatMessage } from "~/lib/types";
import { isGeminiModel, isGroqModel } from "~/lib/openrouter";

const INITIAL_TEXTAREA_HEIGHT = 48;

export function Chatbox({ onSend }: { onSend: (data: ChatMessage) => void }) {
  const sidebar = useSidebar();
  const { selectedModel, setSelectedModel } = useModel();
  const { hasOpenRouterKey, hasGeminiKey, hasGroqKey } = useApiKey();
  const { isSignedIn } = useAuth();
  const { setLoginDialogOpen, setLoginDialogAction } = useChat();
  const isSidebarOpenDesktop = sidebar
    ? sidebar.open && !sidebar.isMobile
    : false;

  const sidebarWidth = sidebar?.width || 256;
  const isResizing = sidebar?.isResizing || false;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageRef = useRef("");
  const [sendDisabled, setSendDisabled] = useState(true);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFileResponse[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  // Check if the current model is available with current API keys
  const isCurrentModelAvailable = () => {
    if (isGeminiModel(selectedModel.id)) {
      return hasGeminiKey;
    }
    if (isGroqModel(selectedModel.id)) {
      return hasGroqKey;
    }
    return hasOpenRouterKey;
  };
  const getRequiredApiKeyForCurrentModel = () => {
    if (isGeminiModel(selectedModel.id)) {
      return "Gemini";
    }
    if (isGroqModel(selectedModel.id)) {
      return "Groq";
    }
    return "OpenRouter";
  };

  const { startUpload, isUploading } = useUploadThing("chatFiles", {
    onClientUploadComplete: (res?: UploadFileResponse<{ type: string }>[]) => {
      if (res) {
        setUploadedFiles((prev) => [...prev, ...res]);
        const completedNames = res.map((f) => f.name);
        setFilesToUpload((prev) =>
          prev.filter((f) => !completedNames.includes(f.name)),
        );
      }
    },
    onUploadError: (error: Error) => {
      alert(`ERROR! ${error.message}`);
      setFilesToUpload([]);
    },
  });
  const resizeTextarea = () => {
    const ta = textareaRef.current!;
    ta.style.height = "auto";
    const newHeight = Math.max(ta.scrollHeight, INITIAL_TEXTAREA_HEIGHT);
    ta.style.height = `${newHeight}px`;
  };
  useEffect(() => {
    let modelAvailable = false;
    if (isGeminiModel(selectedModel.id)) {
      modelAvailable = hasGeminiKey;
    } else if (isGroqModel(selectedModel.id)) {
      modelAvailable = hasGroqKey;
    } else {
      modelAvailable = hasOpenRouterKey;
    }

    const isEmpty = messageRef.current.trim().length === 0;
    const shouldDisable = isEmpty || !modelAvailable;

    if (shouldDisable !== sendDisabled) {
      setSendDisabled(shouldDisable);
    }
  }, [
    hasOpenRouterKey,
    hasGeminiKey,
    hasGroqKey,
    selectedModel.id,
    sendDisabled,
  ]);
  const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const text = (e.currentTarget as HTMLTextAreaElement).value;
    messageRef.current = text;
    resizeTextarea();

    // Check if user is not signed in and they're starting to type
    if (!isSignedIn && text.trim().length > 0) {
      setLoginDialogAction("send");
      setLoginDialogOpen(true);
      // Clear the textarea since they need to sign in first
      e.currentTarget.value = "";
      messageRef.current = "";
      resizeTextarea();
      return;
    }

    const isEmpty = text.trim().length === 0;
    const hasNoApiKey = !isCurrentModelAvailable();
    const shouldDisable = isEmpty || hasNoApiKey;

    if (shouldDisable !== sendDisabled) {
      setSendDisabled(shouldDisable);
    }
  };
  const handleSendMessage = () => {
    const message = messageRef.current.trim();
    if (!message) return;

    // Check if API key is available for the current model
    if (!isCurrentModelAvailable()) {
      setShowApiKeyDialog(true);
      return;
    }

    onSend({
      message,
      searchEnabled:
        searchEnabled && selectedModel.capabilities?.includes("search"),
      files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      thinkingEnabled: selectedModel.capabilities?.includes("thinking"),
    });

    const ta = textareaRef.current!;
    ta.value = "";
    messageRef.current = "";
    setUploadedFiles([]);
    setFilesToUpload([]);
    resizeTextarea();
    setSendDisabled(true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendDisabled) {
        handleSendMessage();
      }
    }
  };
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!selectedModel.capabilities?.includes("vision")) {
      return;
    }

    const clipboardData = e.clipboardData;
    const items = Array.from(clipboardData.items);

    const imageItems = items.filter((item) => item.type.startsWith("image/"));

    if (imageItems.length > 0) {
      e.preventDefault();

      const imageFiles: File[] = [];
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          // Create a more descriptive filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const extension = file.type.split("/")[1] ?? "png";
          const newFile = new File(
            [file],
            `pasted-image-${timestamp}.${extension}`,
            {
              type: file.type,
            },
          );
          imageFiles.push(newFile);
        }
      }

      if (imageFiles.length > 0) {
        // Add to files to upload
        setFilesToUpload((prev) => [...prev, ...imageFiles]);

        // Start upload
        try {
          await startUpload(imageFiles);
        } catch (error) {
          console.error("Failed to upload pasted images:", error);
          // Remove failed files from filesToUpload
          setFilesToUpload((prev) =>
            prev.filter((f) => !imageFiles.some((img) => img.name === f.name)),
          );
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Only allow drag over if model supports vision or document capabilities
    if (
      selectedModel.capabilities?.includes("vision") ||
      selectedModel.capabilities?.includes("pdf")
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    // Only handle drops if model supports vision or document capabilities
    if (
      !selectedModel.capabilities?.includes("vision") &&
      !selectedModel.capabilities?.includes("pdf")
    ) {
      return;
    }

    e.preventDefault();

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf";
      const supportsImages = selectedModel.capabilities?.includes("vision");
      const supportsPDF = selectedModel.capabilities?.includes("pdf");

      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      return (isImage && supportsImages) || (isPDF && supportsPDF);
    });

    if (validFiles.length > 0) {
      // Add to files to upload
      setFilesToUpload((prev) => [...prev, ...validFiles]);

      // Start upload
      try {
        await startUpload(validFiles);
      } catch (error) {
        console.error("Failed to upload dropped files:", error);
        // Remove failed files from filesToUpload
        setFilesToUpload((prev) =>
          prev.filter(
            (f) => !validFiles.some((dropped) => dropped.name === f.name),
          ),
        );
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
      {/* Single container without outer ring */}
      <div className="theme-chatbox w-full max-w-4xl rounded-t-[20px] border border-b-0 p-2 pb-0 shadow-none">
        <form
          className="text-secondary-foreground border-border bg-card outline-border relative flex w-full flex-col items-stretch gap-2 rounded-t-xl border border-b-0 px-3 pt-3 pb-6 outline-8 sm:pb-3 dark:border-[hsla(0,0%,83%,0.04)] dark:bg-[hsla(273.8,15.1%,20.8%,0.045)] dark:outline-[hsla(270,16.13%,12.16%,0.4)]"
          onSubmit={onSubmit}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {" "}
          {/* Show uploaded and uploading files */}
          {(uploadedFiles.length > 0 || filesToUpload.length > 0) && (
            <div className="mb-2 flex flex-wrap gap-2 px-1">
              {uploadedFiles.map((file, index) => {
                const fileType =
                  (file.serverData as { type: string })?.type ?? "";
                const isImage = fileType.startsWith("image/");
                const isPDF = fileType === "application/pdf";

                const handleFileClick = () => {
                  window.open(file.url, "_blank", "noopener,noreferrer");
                };

                return (
                  <div
                    key={index}
                    className="bg-secondary/10 border-secondary/20 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                  >
                    <button
                      type="button"
                      onClick={handleFileClick}
                      className="hover:text-primary flex items-center gap-2 transition-colors"
                      title={`Click to view ${file.name}`}
                    >
                      {isImage ? (
                        <ImageIcon className="h-4 w-4 text-blue-500" />
                      ) : isPDF ? (
                        <FileText className="h-4 w-4 text-red-500" />
                      ) : (
                        <Paperclip className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="max-w-[120px] truncate font-medium">
                        {file.name}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setUploadedFiles((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                      className="text-muted-foreground hover:text-foreground hover:bg-secondary/40 ml-1 rounded p-1 transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              {filesToUpload.map((file, index) => (
                <div
                  key={index}
                  className="bg-secondary/10 border-secondary/20 flex animate-pulse items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <Paperclip className="h-4 w-4 text-gray-500" />
                  <span className="max-w-[120px] truncate font-medium text-gray-400">
                    {file.name}
                  </span>
                </div>
              ))}
              {isUploading && (
                <div className="bg-secondary/10 border-secondary/20 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors">
                  <p className="text-sm text-gray-400">Uploading...</p>
                </div>
              )}
            </div>
          )}{" "}
          <textarea
            ref={textareaRef}
            name="input"
            id="chat-input"
            placeholder={
              selectedModel.capabilities?.includes("vision")
                ? "Type your message here or paste images..."
                : "Type your message here..."
            }
            className="text-foreground placeholder:text-muted-foreground max-h-[200px] min-h-[48px] w-full resize-none overflow-y-auto bg-transparent px-1 outline-none"
            aria-label="Message input"
            defaultValue=""
            onInput={onInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />{" "}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />{" "}
              {/* Search button - show if model has search capability */}
              {selectedModel.capabilities?.includes("search") && (
                <button
                  type="button"
                  onClick={() => setSearchEnabled(!searchEnabled)}
                  className={cn(
                    "focus-visible:ring-ring hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 border-secondary-foreground/10 text-muted-foreground -mb-1.5 inline-flex h-auto items-center justify-center gap-2 rounded-full border border-solid px-3 py-1.5 pr-2.5 pl-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent max-sm:p-2",
                    searchEnabled &&
                      "bg-muted/40 border-secondary-foreground/10 text-foreground",
                  )}
                  aria-label={
                    searchEnabled ? "Disable web search" : "Enable web search"
                  }
                >
                  <Globe className="h-4 w-4" />
                  <span className="max-sm:hidden">Search</span>
                </button>
              )}{" "}
              {/* Attach button - show if model has vision, pdf, or image capabilities */}
              {selectedModel.capabilities &&
                (selectedModel.capabilities.includes("vision") ||
                  selectedModel.capabilities.includes("pdf") ||
                  selectedModel.capabilities.includes("image")) && (
                  <label className="focus-visible:ring-ring hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 border-secondary-foreground/10 text-muted-foreground -mb-1.5 inline-flex h-auto cursor-pointer items-center justify-center gap-2 rounded-full border border-solid px-2 py-1.5 pr-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent max-sm:p-2">
                    <Paperclip className="size-4" />
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept={
                        selectedModel.capabilities?.includes("image") ||
                        selectedModel.capabilities?.includes("vision")
                          ? "image/png,image/jpeg,image/webp,application/pdf"
                          : selectedModel.capabilities?.includes("pdf")
                            ? "application/pdf"
                            : "image/png,image/jpeg,image/webp"
                      }
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length > 0) {
                          setFilesToUpload((prev) => [...prev, ...files]);
                          void startUpload(files);
                          // Reset the input so the same files can be selected again
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                )}
            </div>
            {/* Right: send button */}
            <div className="flex items-center gap-2">
              {" "}
              <Button
                type="submit"
                size="sm"
                aria-label="Send message"
                disabled={sendDisabled}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border p-2",
                  sendDisabled
                    ? "bg-secondary/30 text-secondary-foreground/50 border-secondary/20 hover:bg-secondary/40"
                    : "new-chat-button",
                )}
              >
                <ArrowUp className="h-4 w-4" />{" "}
              </Button>
            </div>
          </div>
        </form>
      </div>{" "}
      {/* API Key Required Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="bg-background border-border sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Key className="text-primary h-6 w-6" />
            </div>
            <DialogTitle className="text-foreground text-lg font-semibold">
              API Key Required
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              You need a {getRequiredApiKeyForCurrentModel()} API key to use{" "}
              <span className="font-medium">{selectedModel.name}</span>.
              <br />
              <br />
              Please add your API key in the settings to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowApiKeyDialog(false)}
              className="hover:bg-muted/40 hover:text-foreground mt-2 sm:mt-0"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowApiKeyDialog(false);
                // You might want to trigger opening settings here
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              Open Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
