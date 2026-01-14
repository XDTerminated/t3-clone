"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MessageWithSyntaxHighlighting } from "../message-with-syntax-highlighting";

interface ReasoningSectionProps {
  reasoning: string;
}

/**
 * Collapsible section to display AI model's reasoning/thinking process
 */
export function ReasoningSection({ reasoning }: ReasoningSectionProps) {
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
