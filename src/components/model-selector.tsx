"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Lightbulb,
  Globe,
  Eye,
  ImageIcon,
  FileText,
} from "lucide-react";
import {
  MODEL_GROUPS,
  type OpenRouterModel,
  isGeminiModel,
  isGroqModel,
} from "~/lib/openrouter";
import { CapabilityTooltip } from "./capability-tooltip";
import { useApiKey } from "~/contexts/ApiKeyContext";

interface ModelSelectorProps {
  selectedModel: OpenRouterModel;
  onModelChange: (model: OpenRouterModel) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasScroll, setHasScroll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { hasOpenRouterKey, hasGeminiKey, hasGroqKey } = useApiKey();

  // Helper function to determine if a model is available based on API keys
  const isModelAvailable = (model: OpenRouterModel) => {
    if (isGeminiModel(model.id)) {
      return hasGeminiKey;
    }
    if (isGroqModel(model.id)) {
      return hasGroqKey;
    }
    // All other models (including free models) require OpenRouter key
    return hasOpenRouterKey;
  };

  // Helper function to get the required API key name for a model
  const getRequiredApiKey = (model: OpenRouterModel) => {
    if (isGeminiModel(model.id)) {
      return "Gemini";
    }
    if (isGroqModel(model.id)) {
      return "Groq";
    }
    return "OpenRouter";
  };

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      setIsOpen(true);
      setIsClosing(false);
    }
  };

  const closeDropdown = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  const handleModelSelect = (model: OpenRouterModel) => {
    onModelChange(model);
    closeDropdown();
  };
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Check if content is scrollable
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const hasScrollableContent =
          scrollRef.current.scrollHeight > scrollRef.current.clientHeight;
        setHasScroll(hasScrollableContent);
      }
    };

    if (isOpen) {
      // Small delay to ensure content is rendered
      setTimeout(checkScroll, 10);
    }
  }, [isOpen]); // Get capabilities icons for a model based on the actual data structure
  const getCapabilityIcons = (model: OpenRouterModel) => {
    const icons = [];

    if (model.capabilities?.includes("search"))
      icons.push(
        <span key="search" className="px-1">
          <CapabilityTooltip content="Can search the web">
            <Globe className="h-3.5 w-3.5" />
          </CapabilityTooltip>
        </span>,
      );
    if (model.capabilities?.includes("vision"))
      icons.push(
        <span key="vision" className="px-1">
          <CapabilityTooltip content="Can read and analyze images">
            <Eye className="h-3.5 w-3.5" />
          </CapabilityTooltip>
        </span>,
      );
    if (model.capabilities?.includes("image"))
      icons.push(
        <span key="image" className="px-1">
          <CapabilityTooltip content="Can generate images">
            <ImageIcon className="h-3.5 w-3.5" />
          </CapabilityTooltip>
        </span>,
      );
    if (model.capabilities?.includes("pdf"))
      icons.push(
        <span key="pdf" className="px-1">
          <CapabilityTooltip content="Can handle file uploads">
            <FileText className="h-3.5 w-3.5" />
          </CapabilityTooltip>
        </span>,
      );
    if (model.capabilities?.includes("reasoning"))
      icons.push(
        <span key="reasoning" className="px-1">
          <CapabilityTooltip content="Has advanced reasoning capabilities">
            <Lightbulb className="h-3.5 w-3.5 text-rose-400/60 dark:text-rose-500/60" />
          </CapabilityTooltip>
        </span>,
      );
    return icons;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Original button styling */}
      <button
        className="focus-visible:ring-ring hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 text-muted-foreground relative -mb-2 inline-flex h-8 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        type="button"
        onClick={toggleDropdown}
      >
        <div className="text-left text-sm font-medium">
          {selectedModel.name}
        </div>
        <ChevronDown className="lucide lucide-chevron-down right-0 size-4" />
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full left-0 z-[100] mb-2 w-[280px] overflow-hidden rounded-lg border border-rose-200/50 bg-white shadow-2xl dark:border-rose-500/20 dark:bg-[oklch(0.18_0.015_25)] ${isClosing ? "dropdown-animate-out" : "dropdown-animate-in"}`}
        >
          {/* Header - Simple version without BYOK button */}
          <div className="border-b border-rose-200/30 p-3 dark:border-rose-500/20">
            <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-100">
              Select Model
            </h3>
          </div>{" "}
          {/* Model List - No controls row */}{" "}
          <div
            ref={scrollRef}
            className={`dropdown-hide-scrollbar dropdown-scroll-indicator max-h-[300px] overflow-x-visible overflow-y-auto ${hasScroll ? "has-scroll" : ""}`}
          >
            {Object.entries(MODEL_GROUPS).map(([provider, models]) => (
              <div
                key={provider}
                className="border-b border-rose-200/30 p-2 last:border-b-0 dark:border-rose-500/20"
              >
                {" "}
                {/* Provider Header */}
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="text-xs font-medium text-rose-500/70 capitalize dark:text-rose-300/70">
                    {provider}
                  </span>
                  <span className="text-xs text-rose-400/60 dark:text-rose-400/60">
                    ({models.length})
                  </span>
                </div>
                {/* Models */}
                <div className="space-y-1">
                  {" "}
                  {models.map((model: OpenRouterModel) => {
                    const isAvailable = isModelAvailable(model);
                    const isSelected = model.id === selectedModel.id;
                    const requiredApiKey = getRequiredApiKey(model);

                    return (
                      <button
                        key={model.id}
                        onClick={() => isAvailable && handleModelSelect(model)}
                        disabled={!isAvailable}
                        className={`group relative w-full overflow-hidden p-1.5 text-left transition-all duration-150 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                          isSelected
                            ? "text-rose-600 dark:text-rose-300"
                            : isAvailable
                              ? "text-black/70 hover:text-rose-600 dark:text-white/70 dark:hover:text-rose-300"
                              : "cursor-not-allowed text-black/70 opacity-40 dark:text-white/70"
                        }`}
                        title={
                          !isAvailable
                            ? `Requires ${requiredApiKey} API key`
                            : undefined
                        }
                      >
                        {/* Hover/Selected Effects */}
                        <div
                          className={`${
                            isSelected
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          } transition-opacity duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/8 to-transparent dark:via-rose-300/8"></div>
                          <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent dark:via-rose-300/30"></div>
                          <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent dark:via-rose-300/30"></div>
                          <div className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 bg-gradient-to-r from-transparent via-rose-500/5 to-transparent blur-sm dark:via-rose-300/5"></div>
                        </div>

                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex min-w-0 flex-1 items-center gap-1.5">
                            <span className="truncate text-sm">
                              {model.name}
                            </span>
                          </div>{" "}
                          <div className="flex items-center gap-1.5">
                            {getCapabilityIcons(model)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
