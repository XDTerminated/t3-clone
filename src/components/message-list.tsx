import * as React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import {
  $convertFromMarkdownString,
  TRANSFORMERS,
  type TextMatchTransformer,
} from "@lexical/markdown";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  $createEquationNode,
  $isEquationNode,
  EquationNode,
} from "./lexical/EquationNode";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import type { LexicalNode, TextNode } from "lexical";
import { useChat } from "~/contexts/ChatContext";
import {
  Image as ImageIcon,
  FileText,
  Paperclip,
  Eye,
  Download,
} from "lucide-react";
import NextImage from "next/image";
import { useState } from "react";

// HACK: Manual type definition to avoid client-side import issues
type UploadFileResponse<T = unknown> = {
  name: string;
  size: number;
  key: string;
  url: string;
  serverData: T;
};

export type Message = {
  sender: string;
  text: string;
  files?: UploadFileResponse[];
};

interface MessageListProps {
  messages: Message[];
}

const editorConfig = {
  namespace: "LexicalViewer",
  nodes: [
    ListNode,
    ListItemNode,
    EquationNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    HeadingNode,
    QuoteNode,
  ],
  onError(error: Error) {
    console.error(error);
  },
  theme: {
    ltr: "text-left",
    rtl: "text-right",
    paragraph: "mb-4 leading-loose",
    text: {
      bold: "font-bold",
      italic: "italic",
      underline: "underline",
      strikethrough: "line-through",
      code: "font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded",
    },
    list: {
      ul: "list-disc pl-6",
      ol: "list-decimal pl-6",
      listitem: "mb-3 py-1",
    },
    link: "text-blue-500 hover:underline",
    equation: "katex-display p-2 m-2 border rounded",
    inlineEquation: "katex-inline",
    code: "bg-gray-100 dark:bg-gray-800 p-4 rounded-md block whitespace-pre-wrap font-mono text-sm",
    quote: "border-l-4 border-gray-300 pl-4 italic",
    heading: {
      h1: "text-3xl font-bold my-4",
      h2: "text-2xl font-bold my-3",
      h3: "text-xl font-bold my-2",
    },
  },
  editable: false,
};

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

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {files.map((file, index) => {
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
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}

// Custom component to render Lexical editor for each message
function LexicalMessage({ text }: { text: string }) {
  const initialConfig = { ...editorConfig };
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="outline-none" />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <InitializeMarkdownPlugin markdownText={text} />
    </LexicalComposer>
  );
}

// Plugin to initialize editor content from a markdown string
function InitializeMarkdownPlugin({ markdownText }: { markdownText: string }) {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    editor.update(() => {
      const dollarEquationTransformer: TextMatchTransformer = {
        dependencies: [EquationNode],
        export: (node: LexicalNode) => {
          if (!$isEquationNode(node)) return null;
          const equation = node.getEquation();
          return node.getInline() ? `$${equation}$` : `$$${equation}$$`;
        },
        importRegExp: /\$\$(.+?)\$\$|\$(.+?)\$/,
        regExp: /\$\$(.+?)\$\$|\$(.+?)\$/,
        replace: (textNode: TextNode, match: RegExpMatchArray) => {
          const equationContent = match[1] ?? match[2];
          if (equationContent) {
            const inline = !match[1];
            const equationNode = $createEquationNode(equationContent, inline);
            textNode.replace(equationNode);
          }
        },
        trigger: "$",
        type: "text-match",
      };

      // Improved regex: matches numbers, words, or parenthesized expressions before and after ^
      // Examples: 10^43, x^2, foo^bar, (a+b)^n
      const caretSuperscriptEquationTransformer: TextMatchTransformer = {
        dependencies: [EquationNode],
        export: (node: LexicalNode) => {
          if (!$isEquationNode(node)) return null;
          const equation = node.getEquation();
          return node.getInline() ? `$${equation}$` : `$$${equation}$$`;
        },
        // Match: 10^43, x^2, foo^bar, (a+b)^n
        regExp: /((?:\\w+|\\d+|\\([^\\)]+\\)))\\^(\\w+|\\d+|\\([^\\)]+\\))/g,
        replace: (textNode: TextNode, match: RegExpMatchArray) => {
          const base = match[1];
          const exponent = match[2];
          const equation = `${base}^{${exponent}}`;
          const equationNode = $createEquationNode(equation, true);
          textNode.replace(equationNode);
        },
        trigger: "^",
        type: "text-match",
      };

      // --- Fix: Replace all <sup>...</sup> patterns in the text node, one at a time, left to right ---
      // This ensures that each 10<sup>43</sup>, 10<sup>50</sup>, etc. is replaced with a proper EquationNode
      const htmlSuperscriptEquationTransformer: TextMatchTransformer = {
        dependencies: [EquationNode],
        export: (node: LexicalNode) => {
          if (!$isEquationNode(node)) return null;
          const equation = node.getEquation();
          return node.getInline() ? `$${equation}$` : `$$${equation}$$`;
        },
        regExp: /(\w+|\d+|\([^\)]+\))<sup>([^<]+)<\/sup>/,
        replace: (textNode: TextNode, match: RegExpMatchArray) => {
          // Only replace the first match in the text node, so Lexical can re-run transformers on the rest
          const base = match[1];
          const exponent = match[2];
          const equation = `${base}^{${exponent}}`;
          const equationNode = $createEquationNode(equation, true);
          textNode.replace(equationNode);
        },
        trigger: "<",
        type: "text-match",
      };
      // --- End fix ---

      // --- Fix: Replace all N^M patterns in the text node, one at a time, left to right ---
      // This ensures that each 10^43, 10^50, etc. is replaced with a proper EquationNode
      const caretSuperscriptStandaloneTransformer: TextMatchTransformer = {
        dependencies: [EquationNode],
        export: (node: LexicalNode) => {
          if (!$isEquationNode(node)) return null;
          const equation = node.getEquation();
          return node.getInline() ? `$${equation}$` : `$$${equation}$$`;
        },
        regExp: /(\d+)\^(\d+)/,
        replace: (textNode: TextNode, match: RegExpMatchArray) => {
          // Only replace the first match in the text node, so Lexical can re-run transformers on the rest
          const base = match[1];
          const exponent = match[2];
          const equation = `${base}^{${exponent}}`;
          const equationNode = $createEquationNode(equation, true);
          textNode.replace(equationNode);
        },
        trigger: "^",
        type: "text-match",
      };
      // --- End fix ---

      const extendedTransformers = [
        htmlSuperscriptEquationTransformer,
        caretSuperscriptStandaloneTransformer,
        caretSuperscriptEquationTransformer,
        dollarEquationTransformer,
        ...TRANSFORMERS,
      ];
      $convertFromMarkdownString(markdownText, extendedTransformers);
    });
  }, [editor, markdownText]);
  return null;
}

export default function MessageList({ messages }: MessageListProps) {
  const {
    regenerateResponse,
    getMessageAlternativeInfo,
    selectMessageAlternative,
    isMessageNavigable,
  } = useChat();

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [copiedStates, setCopiedStates] = React.useState<
    Record<number, boolean>
  >({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Copy functionality with visual feedback
  const handleCopy = async (text: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [messageIndex]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [messageIndex]: false }));
      }, 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
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
                <div className="prose dark:prose-invert max-w-none leading-relaxed [&_ol:last-child]:mb-0 [&_p:last-child]:mb-0 [&_ul:last-child]:mb-0">
                  <LexicalMessage text={msg.text} />
                </div>
                {msg.files && msg.files.length > 0 && (
                  <FileAttachments files={msg.files} />
                )}
              </div>{" "}
              {/* Copy button for user messages */}
              <div className="absolute right-0 mt-5 -mr-0.5 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100">
                <button
                  onClick={() => handleCopy(msg.text, idx)}
                  className="focus-visible:ring-ring hover:text-foreground disabled:hover:text-foreground/50 hover:bg-muted-foreground/10 inline-flex h-8 w-8 items-center justify-center gap-2 rounded-lg p-0 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  aria-label="Copy message to clipboard"
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
              <div
                role="article"
                aria-label="Assistant message"
                className="prose dark:prose-invert animate-fadeIn max-w-none leading-relaxed opacity-0"
              >
                <span className="sr-only">Assistant Reply: </span>
                <LexicalMessage text={msg.text} />
              </div>
              <div className="absolute left-0 mt-5 -ml-0.5 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100">
                {" "}
                <button
                  onClick={() => handleCopy(msg.text, idx)}
                  className="focus-visible:ring-ring hover:text-foreground disabled:hover:text-foreground/50 hover:bg-muted-foreground/10 inline-flex h-8 w-8 items-center justify-center gap-2 rounded-lg p-0 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  aria-label="Copy response to clipboard"
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
                </button>{" "}
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
                </button>{" "}
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
