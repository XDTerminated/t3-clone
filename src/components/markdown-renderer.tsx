"use client";

import React from "react";
import { CodeBlock, InlineCode } from "./code-block";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Parse markdown and render with custom code block components
  const renderMarkdown = (text: string) => {
    const parts = [];
    let currentIndex = 0;

    // Find code blocks (```language\ncode\n```)
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index);
        parts.push(renderInlineElements(beforeText, parts.length));
      }
      // Add code block
      const language = match[1] ?? "text";
      const code = match[2];
      parts.push(
        <CodeBlock key={parts.length} language={language}>
          {code}
        </CodeBlock>,
      );

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      parts.push(renderInlineElements(remainingText, parts.length));
    }

    return parts.length > 0 ? parts : [renderInlineElements(text, 0)];
  };

  const renderInlineElements = (text: string, key: number) => {
    // Handle inline code (`code`)
    const inlineCodeRegex = /`([^`]+)`/g;
    const parts = [];
    let currentIndex = 0;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > currentIndex) {
        parts.push(text.slice(currentIndex, match.index));
      }

      // Add inline code
      parts.push(
        <InlineCode key={`${key}-${parts.length}`}>{match[1]}</InlineCode>,
      );

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.slice(currentIndex));
    }

    return parts.length > 1 ? (
      <span key={key}>
        {parts.map((part, index) =>
          typeof part === "string" ? <span key={index}>{part}</span> : part,
        )}
      </span>
    ) : (
      <span key={key}>{text}</span>
    );
  };

  return <div className="markdown-content">{renderMarkdown(content)}</div>;
}
