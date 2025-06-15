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

export type Message = { sender: string; text: string };

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
    prevBranch,
    nextBranch,
    branchIndex,
    branchCount,
  } = useChat();

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);
  return (
    <div
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      className="pt-safe-offset-10 mx-auto flex w-full max-w-3xl flex-col space-y-16 px-4 pt-12 pb-40"
    >
      {messages.map((msg, idx) => (
        <div
          key={idx}
          data-message-id={`${idx}`}
          className={`flex ${msg.sender === "User" ? "justify-end" : "justify-start"}`}
        >
          {msg.sender === "User" ? (
            <div
              role="article"
              aria-label="Your message"
              className="group border-secondary/50 bg-muted relative inline-block max-w-[80%] rounded-xl border px-4 py-3 text-left break-words"
            >
              <span className="sr-only">Your message: </span>
              <div className="flex flex-col">
                <div className="prose dark:prose-invert max-w-none leading-relaxed [&_ol:last-child]:mb-0 [&_p:last-child]:mb-0 [&_ul:last-child]:mb-0">
                  <LexicalMessage text={msg.text} />
                </div>
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
                  className="focus-visible:ring-ring hover:text-foreground disabled:hover:text-foreground/50 hover:bg-muted-foreground/10 inline-flex h-8 w-8 items-center justify-center gap-2 rounded-lg p-0 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
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
                      className="lucide lucide-copy ease-snappy absolute inset-0 scale-100 opacity-100 transition-all duration-200"
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
                      className="lucide lucide-check ease-snappy absolute inset-0 scale-0 opacity-0 transition-all duration-200"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                </button>{" "}
                <button
                  aria-label="Regenerate response"
                  onClick={() => regenerateResponse(idx - 1)}
                  className="focus-visible:ring-ring hover:text-foreground disabled:hover:text-foreground/50 hover:bg-muted-foreground/10 inline-flex h-8 w-8 items-center justify-center gap-2 rounded-lg p-0 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
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
              </div>

              {/* Branch navigation controls - show for AI messages when there are multiple branches */}
              {branchCount > 1 && idx === messages.length - 1 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={prevBranch}
                    disabled={branchIndex <= 0}
                    className="focus-visible:ring-ring hover:text-foreground disabled:hover:text-foreground/50 hover:bg-muted-foreground/10 inline-flex h-8 w-8 items-center justify-center gap-2 rounded-lg p-0 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                    aria-label="Previous branch"
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
                    {branchIndex + 1} / {branchCount}
                  </span>

                  <button
                    onClick={nextBranch}
                    disabled={branchIndex >= branchCount - 1}
                    className="focus-visible:ring-ring hover:text-foreground disabled:hover:text-foreground/50 hover:bg-muted-foreground/10 inline-flex h-8 w-8 items-center justify-center gap-2 rounded-lg p-0 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                    aria-label="Next branch"
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
              )}
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
