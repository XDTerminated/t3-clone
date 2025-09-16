"use client";

import React, { useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
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
import type { TextMatchTransformer } from "@lexical/markdown";

// Enhanced editor config with custom code block theme
const editorConfig = {
  namespace: "EnhancedLexicalViewer",
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
    code: "syntax-highlight-placeholder", // We'll replace this with our component
    quote: "border-l-4 border-gray-300 pl-4 italic",
    heading: {
      h1: "text-3xl font-bold my-4",
      h2: "text-2xl font-bold my-3",
      h3: "text-xl font-bold my-2",
    },
  },
  editable: false,
};

// Function to clean and normalize AI response text
function normalizeAIResponse(text: string): string {
  if (!text) return text;

  // Remove any leading whitespace or invisible characters
  let cleaned = text.replace(/^[\s\u200B-\u200D\uFEFF]+/, "");

  // Ensure first character is capitalized if it's a letter
  if (cleaned.length > 0) {
    const firstChar = cleaned.charAt(0);
    if (/[a-z]/.test(firstChar)) {
      cleaned = firstChar.toUpperCase() + cleaned.slice(1);
    }
  }

  return cleaned;
}

// Plugin to enhance code blocks after rendering
function EnhanceCodeBlocksPlugin() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Find all code blocks and replace them with syntax-highlighted versions
    const codeBlocks = container.querySelectorAll(
      ".syntax-highlight-placeholder",
    );

    codeBlocks.forEach((codeBlock) => {
      // Try to detect language from the content or parent elements

      // Create a container for our enhanced code block
      const enhancedContainer = document.createElement("div");

      // Use React to render our CodeBlock component
      const reactContainer = document.createElement("div");
      container.appendChild(reactContainer);

      // Replace the original code block
      codeBlock.parentNode?.replaceChild(enhancedContainer, codeBlock);

      // We'll need to render our React component here, but this is getting complex
      // Let me try a simpler approach
    });
  });

  return <div ref={containerRef} className="w-full" />;
}

// Plugin to initialize editor content from a markdown string
function InitializeMarkdownPlugin({ markdownText }: { markdownText: string }) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    editor.update(() => {
      // Equation transformers (keeping the original logic)
      const dollarEquationTransformer: TextMatchTransformer = {
        dependencies: [EquationNode],
        export: (node: LexicalNode) => {
          if (!$isEquationNode(node)) return null;
          const equation = node.getEquation();
          return node.getInline() ? `$${equation}$` : `$$${equation}$$`;
        },
        regExp: /\$\$([^$]+?)\$\$/,
        replace: (textNode: TextNode, match: RegExpMatchArray) => {
          const equation = match[1];
          if (equation) {
            const equationNode = $createEquationNode(equation, false);
            textNode.replace(equationNode);
          }
        },
        trigger: "$",
        type: "text-match",
      };

      const caretSuperscriptEquationTransformer: TextMatchTransformer = {
        dependencies: [EquationNode],
        export: (node: LexicalNode) => {
          if (!$isEquationNode(node)) return null;
          const equation = node.getEquation();
          return node.getInline() ? `$${equation}$` : `$$${equation}$$`;
        },
        regExp: /((?:\w+|\d+|\([^\)]+\)))\^(\w+|\d+|\([^\)]+\))/g,
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

      const htmlSuperscriptEquationTransformer: TextMatchTransformer = {
        dependencies: [EquationNode],
        export: (node: LexicalNode) => {
          if (!$isEquationNode(node)) return null;
          const equation = node.getEquation();
          return node.getInline() ? `$${equation}$` : `$$${equation}$$`;
        },
        regExp: /(\w+|\d+|\([^\)]+\))<sup>([^<]+)<\/sup>/,
        replace: (textNode: TextNode, match: RegExpMatchArray) => {
          const base = match[1];
          const exponent = match[2];
          const equation = `${base}^{${exponent}}`;
          const equationNode = $createEquationNode(equation, true);
          textNode.replace(equationNode);
        },
        trigger: "<",
        type: "text-match",
      };

      const caretSuperscriptStandaloneTransformer: TextMatchTransformer = {
        dependencies: [EquationNode],
        export: (node: LexicalNode) => {
          if (!$isEquationNode(node)) return null;
          const equation = node.getEquation();
          return node.getInline() ? `$${equation}$` : `$$${equation}$$`;
        },
        regExp: /(\d+)\^(\d+)/,
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

interface EnhancedMessageProps {
  text: string;
}

function preprocessMarkdownSetext(input: string): string {
  if (!input) return input;

  let result = input;

  // Convert setext-style headings (underlines) to ATX-style
  // H1: Title\n===== -> # Title
  result = result.replace(/(^|\n)\s*([^\n]+)\n\s*=+\s*(?=\n|$)/g, (_m, p1, title) => `${p1}# ${title}`);

  // H2: Title\n----- -> ## Title
  result = result.replace(/(^|\n)\s*([^\n]+)\n\s*-+\s*(?=\n|$)/g, (_m, p1, title) => `${p1}## ${title}`);

  // Single-line fallback like: "Heading -----" or "Heading ====="
  result = result.replace(/(^|\n)\s*([^\n]+?)\s*-{3,}\s*$/gm, (_m, p1, title) => `${p1}## ${title}`);
  result = result.replace(/(^|\n)\s*([^\n]+?)\s*={3,}\s*$/gm, (_m, p1, title) => `${p1}# ${title}`);

  // Normalize horizontal rules to a clean '---' line
  result = result.replace(/(^|\n)\s*([-*_])\2{2,}\s*(?=\n|$)/g, (_m, p1) => `${p1}---`);

  return result;
}

export function EnhancedMessage({ text }: EnhancedMessageProps) {
  const normalizedText = preprocessMarkdownSetext(normalizeAIResponse(text));
  const initialConfig = { ...editorConfig };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="outline-none" />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <InitializeMarkdownPlugin markdownText={normalizedText} />
      <EnhanceCodeBlocksPlugin />
    </LexicalComposer>
  );
}
