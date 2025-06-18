"use client";

import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { cn } from "~/lib/utils";

interface CodeBlockProps {
  children: React.ReactNode;
  language?: string;
  className?: string;
}

export function CodeBlock({
  children,
  language = "text",
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  // Convert children to string for copying and highlighting
  const codeString = React.Children.toArray(children)
    .map((child) => (typeof child === "string" ? child : ""))
    .join("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Clean up language name (remove "language-" prefix if present)
  const cleanLanguage = language.replace(/^language-/, "");

  return (
    <div className={cn("group relative", className)}>
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/70 opacity-0 transition-all group-hover:opacity-100 hover:border-white/20 hover:bg-black/40 hover:text-white"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={cleanLanguage}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
          lineHeight: "1.5",
        }}
        showLineNumbers={false}
        wrapLines={true}
        wrapLongLines={true}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

// Inline code component for single-line code snippets
export function InlineCode({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const codeString = React.Children.toArray(children)
    .map((child) => (typeof child === "string" ? child : ""))
    .join("");

  return (
    <code
      className={cn(
        "bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-sm",
        className,
      )}
    >
      {codeString}
    </code>
  );
}
