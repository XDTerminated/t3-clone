"use client";

import React from "react";
import { CodeBlock, InlineCode } from "./code-block";

interface MessageWithSyntaxHighlightingProps {
  text: string;
}

export function MessageWithSyntaxHighlighting({
  text,
}: MessageWithSyntaxHighlightingProps) {
  // Split text into parts, separating code blocks from regular markdown
  const renderMessageContent = () => {
    const parts = [];

    // Pattern to match code blocks: ```language\ncode\n```
    const codeBlockPattern = /```(\w+)?\n([\s\S]*?)\n```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockPattern.exec(text)) !== null) {
      // Add text before this code block
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText.trim()) {
          parts.push(
            <div
              key={`markdown-${parts.length}`}
              className="prose dark:prose-invert max-w-none"
            >
              {renderMarkdownContent(beforeText)}
            </div>,
          );
        }
      }

      // Add the code block
      const language = match[1] ?? "text";
      const code = match[2];
      parts.push(
        <CodeBlock key={`code-${parts.length}`} language={language}>
          {code}
        </CodeBlock>,
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last code block
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push(
          <div
            key={`markdown-${parts.length}`}
            className="prose dark:prose-invert max-w-none"
          >
            {renderMarkdownContent(remainingText)}
          </div>,
        );
      }
    }

    // If no code blocks were found, render the entire text
    if (parts.length === 0) {
      parts.push(
        <div key="markdown-0" className="prose dark:prose-invert max-w-none">
          {renderMarkdownContent(text)}
        </div>,
      );
    }

    return parts;
  };
  // Process markdown content (headers, lists, paragraphs, etc.)
  const renderMarkdownContent = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactElement[] = [];
    let currentParagraph: string[] = [];
    let inList = false;
    let listItems: string[] = [];
    let listType = "ul"; // 'ul' for bullets, 'ol' for numbers

    const finishCurrentElements = () => {
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={`p-${elements.length}`} className="mb-4 leading-loose">
            {renderInlineFormatting(currentParagraph.join("\n"))}
          </p>,
        );
        currentParagraph = [];
      }
      if (inList && listItems.length > 0) {
        const ListComponent = listType === "ol" ? "ol" : "ul";
        const listClass =
          listType === "ol" ? "list-decimal pl-6 mb-4" : "list-disc pl-6 mb-4";
        elements.push(
          React.createElement(
            ListComponent,
            { key: `list-${elements.length}`, className: listClass },
            listItems.map((item, idx) => (
              <li key={`li-${idx}`} className="mb-1">
                {renderInlineFormatting(item)}
              </li>
            )),
          ),
        );
        listItems = [];
        inList = false;
      }
    };
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) {
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${elements.length}`} className="mb-4 leading-loose">
              {renderInlineFormatting(currentParagraph.join("\n"))}
            </p>,
          );
          currentParagraph = [];
        }
        continue;
      }

      // Headers
      if (trimmedLine.startsWith("### ")) {
        finishCurrentElements();
        elements.push(
          <h3 key={`h3-${elements.length}`} className="my-2 text-xl font-bold">
            {renderInlineFormatting(trimmedLine.slice(4))}
          </h3>,
        );
      } else if (trimmedLine.startsWith("## ")) {
        finishCurrentElements();
        elements.push(
          <h2 key={`h2-${elements.length}`} className="my-3 text-2xl font-bold">
            {renderInlineFormatting(trimmedLine.slice(3))}
          </h2>,
        );
      } else if (trimmedLine.startsWith("# ")) {
        finishCurrentElements();
        elements.push(
          <h1 key={`h1-${elements.length}`} className="my-4 text-3xl font-bold">
            {renderInlineFormatting(trimmedLine.slice(2))}
          </h1>,
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(trimmedLine)) {
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${elements.length}`} className="mb-4 leading-loose">
              {renderInlineFormatting(currentParagraph.join("\n"))}
            </p>,
          );
          currentParagraph = [];
        }

        // If we were in a different type of list, finish it
        if (inList && listType !== "ol") {
          finishCurrentElements();
        }

        if (!inList || listType !== "ol") {
          inList = true;
          listType = "ol";
        }

        const listContent = trimmedLine.replace(/^\d+\.\s/, "");
        listItems.push(listContent);
      }
      // Bullet lists
      else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        if (currentParagraph.length > 0) {
          elements.push(
            <p key={`p-${elements.length}`} className="mb-4 leading-loose">
              {renderInlineFormatting(currentParagraph.join("\n"))}
            </p>,
          );
          currentParagraph = [];
        }

        // If we were in a different type of list, finish it
        if (inList && listType !== "ul") {
          finishCurrentElements();
        }

        if (!inList || listType !== "ul") {
          inList = true;
          listType = "ul";
        }

        const listContent = trimmedLine.slice(2);
        listItems.push(listContent);
      }
      // Regular paragraph content
      else {
        if (inList) {
          finishCurrentElements();
        }
        currentParagraph.push(line);
      }
    }

    // Finish any remaining elements
    finishCurrentElements();

    return elements;
  };

  // Enhanced inline formatting (bold, italic, inline code, links)
  const renderInlineFormatting = (text: string) => {
    const elements = [];
    let currentIndex = 0;

    // Handle inline code first (`code`)
    const inlineCodePattern = /`([^`\n]+)`/g;
    let match;

    while ((match = inlineCodePattern.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index);
        elements.push(...renderBasicFormatting(beforeText, elements.length));
      }

      // Add inline code
      elements.push(
        <InlineCode key={`inline-code-${elements.length}`}>
          {match[1]}
        </InlineCode>,
      );

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      elements.push(...renderBasicFormatting(remainingText, elements.length));
    }

    return elements.length > 0 ? elements : [renderBasicFormatting(text, 0)];
  };

  // Handle basic markdown formatting (bold, italic, links)
  const renderBasicFormatting = (text: string, baseKey: number) => {
    const elements = [];
    let currentIndex = 0;

    // Combined pattern for bold, italic, and links
    // **bold**, *italic*, [link](url)
    const formatPattern = /(\*\*(.*?)\*\*|\*(.*?)\*|\[(.*?)\]\((.*?)\))/g;
    let match;

    while ((match = formatPattern.exec(text)) !== null) {
      // Add text before formatting
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index);
        if (beforeText) {
          elements.push(
            <span key={`text-${baseKey}-${elements.length}`}>
              {beforeText}
            </span>,
          );
        }
      }

      // Determine which format was matched
      if (match[0].startsWith("**")) {
        // Bold text
        elements.push(
          <strong key={`bold-${baseKey}-${elements.length}`}>
            {match[2]}
          </strong>,
        );
      } else if (match[0].startsWith("*")) {
        // Italic text
        elements.push(
          <em key={`italic-${baseKey}-${elements.length}`}>{match[3]}</em>,
        );
      } else if (match[0].startsWith("[")) {
        // Link
        elements.push(
          <a
            key={`link-${baseKey}-${elements.length}`}
            href={match[5]}
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {match[4]}
          </a>,
        );
      }

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      if (remainingText) {
        elements.push(
          <span key={`text-${baseKey}-${elements.length}`}>
            {remainingText}
          </span>,
        );
      }
    }

    return elements.length > 0
      ? elements
      : [<span key={`basic-${baseKey}`}>{text}</span>];
  };

  return (
    <div className="message-content space-y-4">{renderMessageContent()}</div>
  );
}
