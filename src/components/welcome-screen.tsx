"use client";

import { useState } from "react";
import { Sparkles, Newspaper, Code, GraduationCap } from "lucide-react";
import { cn } from "~/lib/utils";

interface WelcomeScreenProps {
  onPromptSelect: (message: string) => void;
}

const categories = [
  {
    id: "create",
    name: "Create",
    icon: Sparkles,
    selected: true,
    prompts: [
      "Write a short story about a robot discovering emotions",
      "Help me brainstorm ideas for a creative marketing campaign",
      "Create a compelling character backstory for my novel",
      "Generate creative names for a new tech startup",
    ],
  },
  {
    id: "explore",
    name: "Explore",
    icon: Newspaper,
    selected: false,
    prompts: [
      "Explain the latest developments in quantum computing",
      "What are the current trends in sustainable technology?",
      "Help me understand the basics of cryptocurrency",
      "Explore the potential impact of AI on healthcare",
    ],
  },
  {
    id: "code",
    name: "Code",
    icon: Code,
    selected: false,
    prompts: [
      "Help me debug this JavaScript function",
      "Explain the best practices for React component design",
      "Review my code and suggest improvements",
      "Create a simple REST API using Node.js",
    ],
  },
  {
    id: "learn",
    name: "Learn",
    icon: GraduationCap,
    selected: false,
    prompts: [
      "Teach me the fundamentals of machine learning",
      "Explain complex physics concepts in simple terms",
      "Help me create a study plan for learning Python",
      "Break down the history of the Renaissance period",
    ],
  },
];

export default function WelcomeScreen({ onPromptSelect }: WelcomeScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Show "create" prompts by default, but don't highlight the button
  const currentCategory = categories.find(
    (cat) => cat.id === (selectedCategory ?? "create"),
  );
  return (
    <div className="flex h-full items-start justify-center pt-24">
      <div className="animate-in fade-in-50 zoom-in-95 w-full max-w-3xl space-y-6 px-2 duration-100 sm:px-8">
        <h2 className="text-center text-3xl font-semibold">
          How can I help you today?
        </h2>{" "}
        {/* Category Buttons */}
        <div className="flex flex-row flex-wrap justify-center gap-2.5 text-sm max-sm:justify-evenly">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "new-chat-button focus-visible:ring-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold whitespace-nowrap shadow transition-colors select-none focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                  "flex items-center gap-1 rounded-xl px-5 py-2 font-semibold backdrop-blur-xl max-sm:size-16 max-sm:flex-col sm:gap-2 sm:rounded-full",
                  isSelected ? "opacity-100" : "opacity-70 hover:opacity-90",
                )}
                data-selected={isSelected}
              >
                <Icon className="max-sm:block" />
                <div>{category.name}</div>
              </button>
            );
          })}{" "}
        </div>{" "}
        {/* Prompt Suggestions */}{" "}
        <div className="text-foreground mx-auto flex max-w-2xl flex-col space-y-2">
          {currentCategory?.prompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onPromptSelect(prompt)}
              className="text-secondary-foreground w-full rounded-lg px-4 py-3 text-center transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
            >
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
