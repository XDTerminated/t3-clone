"use client";

import { useState } from "react";
import { Sparkles, Newspaper, Code, GraduationCap } from "lucide-react";
import { cn } from "~/lib/utils";

interface WelcomeScreenProps {
  onPromptSelect: (prompt: string) => void;
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
  const [selectedCategory, setSelectedCategory] = useState("create");

  const currentCategory = categories.find((cat) => cat.id === selectedCategory);  return (
    <div className="flex h-full items-start justify-center pt-24">
      <div className="w-full max-w-3xl space-y-6 px-2 duration-300 animate-in fade-in-50 zoom-in-95 sm:px-8">
        <h2 className="text-center text-3xl font-semibold">How can I help you today?</h2>
        {/* Category Buttons */}
      <div className="flex flex-row flex-wrap justify-center gap-2.5 text-sm max-sm:justify-evenly">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}              className={cn(
                "justify-center whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
                "h-9 flex items-center gap-1 rounded-xl px-5 py-2 font-semibold outline-1 outline-secondary/70 backdrop-blur-xl max-sm:size-16 max-sm:flex-col sm:gap-2 sm:rounded-full",
                isSelected
                  ? "border-reflect button-reflect bg-[rgb(162,59,103)] text-primary-foreground shadow hover:bg-[#d56698] active:bg-[rgb(162,59,103)] disabled:hover:bg-[rgb(162,59,103)] disabled:active:bg-[rgb(162,59,103)] dark:bg-primary/20 dark:hover:bg-pink-800/70 dark:active:bg-pink-800/40 disabled:dark:hover:bg-primary/20 disabled:dark:active:bg-primary/20"
                  : "bg-primary text-primary-foreground shadow hover:bg-pink-600/90 disabled:hover:bg-primary data-[selected=false]:bg-secondary/30 data-[selected=false]:text-secondary-foreground/90 data-[selected=false]:outline data-[selected=false]:hover:bg-secondary"
              )}
              data-selected={isSelected}
            >
              <Icon className="max-sm:block" />
              <div>{category.name}</div>
            </button>
          );
        })}
      </div>      {/* Prompt Suggestions */}
      <div className="flex flex-col text-foreground max-w-2xl mx-auto space-y-1">
        {currentCategory?.prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptSelect(prompt)}
            className="w-full rounded-md py-3 text-center text-secondary-foreground hover:bg-secondary/50 sm:px-3"
          >
            <span>{prompt}</span>
          </button>))}
      </div>
    </div>
    </div>
  );
}
