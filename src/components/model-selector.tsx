"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Search,
  ChevronUp,
  Filter,
  Eye,
  Globe,
  FileText,
  Brain,
  ImagePlus,
} from "lucide-react";
import { SiAnthropic } from "react-icons/si";
import { FaMeta } from "react-icons/fa6";
import {
  AVAILABLE_MODELS,
  OTHER_MODELS,
  type OpenRouterModel,
} from "~/lib/openrouter";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/components/ui/tooltip";

interface ModelSelectorProps {
  selectedModel: OpenRouterModel;
  onModelChange: (model: OpenRouterModel) => void;
}

// Model icons mapping for favorites menu (smaller size)
const getModelIconSmall = (modelId: string) => {
  if (modelId.includes("gemini")) {
    return (
      <svg
        className="size-4 text-white"
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <title>Gemini</title>
        <path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z"></path>
      </svg>
    );
  } else if (modelId.includes("deepseek")) {
    return (
      <svg
        className="size-4 text-white"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <title>DeepSeek</title>
        <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"></path>
      </svg>
    );
  } else if (
    modelId.includes("openai") ||
    modelId.includes("gpt") ||
    modelId.includes("o1")
  ) {
    return (
      <svg
        className="size-4 text-white"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <title>OpenAI</title>
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
      </svg>
    );
  } else if (modelId.includes("anthropic") || modelId.includes("claude")) {
    return <SiAnthropic className="size-4 text-white" />;
  } else if (modelId.includes("llama") || modelId.includes("meta")) {
    return <FaMeta className="size-4 text-white" />;
  } else if (modelId.includes("qwen")) {
    return (
      <Image
        src="/qwen.svg"
        alt="Qwen"
        width={16}
        height={16}
        className="text-white"
      />
    );
  } else if (modelId.includes("microsoft") || modelId.includes("phi")) {
    return (
      <svg
        className="size-4 text-white"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <title>Microsoft</title>
        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"></path>
      </svg>
    );
  }
  // Default icon for other models
  return <Brain className="size-4 text-white" />;
};

// Model icons mapping for show all menu (card size)
const getModelIcon = (modelId: string, size: "small" | "large" = "small") => {
  const sizeClass = size === "small" ? "size-6" : "size-8";
  if (modelId.includes("gemini")) {
    return (
      <svg
        className={`text-white ${sizeClass}`}
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <title>Gemini</title>
        <path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z"></path>
      </svg>
    );
  } else if (modelId.includes("deepseek")) {
    return (
      <svg
        className={`text-white ${sizeClass}`}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <title>DeepSeek</title>
        <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"></path>
      </svg>
    );
  } else if (
    modelId.includes("openai") ||
    modelId.includes("gpt") ||
    modelId.includes("o1")
  ) {
    return (
      <svg
        className={`text-white ${sizeClass}`}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <title>OpenAI</title>
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
      </svg>
    );
  } else if (modelId.includes("anthropic") || modelId.includes("claude")) {
    return <SiAnthropic className={`text-white ${sizeClass}`} />;
  } else if (modelId.includes("llama") || modelId.includes("meta")) {
    return <FaMeta className={`text-white ${sizeClass}`} />;
  } else if (modelId.includes("qwen")) {
    const iconSize = size === "small" ? 24 : 32;
    return (
      <Image
        src="/qwen.svg"
        alt="Qwen"
        width={iconSize}
        height={iconSize}
        className="text-white"
      />
    );
  } else if (modelId.includes("microsoft") || modelId.includes("phi")) {
    return (
      <svg
        className={`text-white ${sizeClass}`}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <title>Microsoft</title>
        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"></path>
      </svg>
    );
  }
  // Default icon for other models
  return <Brain className={`text-white ${sizeClass}`} />;
};

// Capability badges
const CapabilityBadge = ({
  icon: Icon,
  colorDark,
  colorLight,
  tooltip,
}: {
  icon: React.ComponentType<{ className?: string }>;
  colorDark: string;
  colorLight: string;
  tooltip: string;
}) => (
  <Tooltip>
    <TooltipTrigger>
      <div
        className="group relative flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-md"
        style={
          {
            backgroundColor: colorLight,
            color: colorDark,
          } as React.CSSProperties
        }
      >
        <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
      </div>
    </TooltipTrigger>
    <TooltipContent sideOffset={4}>{tooltip}</TooltipContent>
  </Tooltip>
);

// Maps for dynamic capability badges
const capabilityIconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  vision: Eye,
  search: Globe,
  text: FileText,
  pdf: FileText,
  reasoning: Brain,
  image: ImagePlus,
};
const capabilityColorMap: Record<
  string,
  { colorDark: string; colorLight: string }
> = {
  vision: { colorDark: "#14b8a6", colorLight: "rgba(20, 184, 166, 0.2)" }, // Muted teal like in image
  search: { colorDark: "#3b82f6", colorLight: "rgba(59, 130, 246, 0.2)" }, // Muted blue like in image
  text: { colorDark: "hsl(237 75% 77%)", colorLight: "hsl(237 55% 57%)" },
  pdf: { colorDark: "#8b5cf6", colorLight: "rgba(139, 92, 246, 0.2)" }, // Muted purple like in image
  reasoning: { colorDark: "#8b5cf6", colorLight: "rgba(139, 92, 246, 0.2)" }, // Muted purple like in image
  image: { colorDark: "#f97316", colorLight: "rgba(249, 115, 22, 0.2)" }, // Muted orange like in image
};
const capabilityTooltipMap: Record<string, string> = {
  vision: "Support image uploads and analysis",
  search: "Uses web search to answer questions",
  text: "Support PDF uploads and analysis",
  pdf: "Support document uploads and analysis",
  reasoning: "Has reasoning capabilities",
  image: "Image generation support",
};

export function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"favorites" | "all">("favorites");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 150); // Match fade animation duration
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);
  const filteredModels =
    viewMode === "favorites"
      ? AVAILABLE_MODELS.filter(
          (model) =>
            model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.provider.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : AVAILABLE_MODELS.filter(
          (model) =>
            model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.provider.toLowerCase().includes(searchQuery.toLowerCase()),
        );

  const filteredOtherModels = OTHER_MODELS.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  return (
    <div className="relative" ref={dropdownRef}>
      {" "}
      <button
        className="focus-visible:ring-ring hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 text-muted-foreground relative -mb-2 inline-flex h-8 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        type="button"
        onClick={() => {
          if (isOpen) {
            closeDropdown();
          } else {
            setViewMode("favorites"); // Always open to favorites
            setIsOpen(true);
          }
        }}
      >
        {" "}
        <div className="text-left text-sm font-medium">
          {selectedModel.name}
        </div>
        <ChevronDown className="lucide lucide-chevron-down right-0 size-4" />
      </button>{" "}
      {isOpen && (
        <>
          {/* Dropdown Content */}{" "}
          <div
            className={`text-popover-foreground absolute bottom-full left-0 z-50 mb-2 ${
              viewMode === "favorites"
                ? "h-[480px] w-[360px]"
                : "h-[580px] w-[600px]"
            } max-w-[calc(100vw-2rem)] overflow-visible rounded-lg border-none p-0 pt-10 pb-11 shadow-md ${
              isClosing
                ? "animate-out fade-out duration-150"
                : "animate-in slide-in-from-bottom-2 slide-in-from-left-2 zoom-in-98 duration-300 ease-out"
            }`}
            style={{
              backgroundColor: "#100A0E",
              transformOrigin: "bottom left",
              transition:
                "width 400ms cubic-bezier(0.16, 1, 0.3, 1), height 400ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {" "}
            <div
              className="max-h-full overflow-y-auto px-1.5"
              style={
                {
                  position: "relative",
                  scrollbarWidth: "thin",
                  scrollbarColor: "transparent transparent",
                } as React.CSSProperties
              }
            >
              {viewMode === "favorites" ? (
                // Favorites View
                filteredModels.map((model) => {
                  return (
                    <div
                      key={model.id}
                      role="menuitem"
                      className="group relative flex cursor-pointer flex-col items-start gap-1 rounded-sm py-3 pr-3 pl-3 text-sm transition-colors outline-none select-none hover:bg-black/20"
                      onClick={() => {
                        onModelChange(model);
                        closeDropdown();
                      }}
                    >
                      <div className="flex w-full items-center justify-between">
                        {" "}
                        <div className="flex items-center gap-2 pr-2 font-medium text-[#E7D0DD] transition-colors">
                          {getModelIconSmall(model.id)}
                          <span className="w-fit text-[#E7D0DD]">
                            {model.name}
                          </span>
                        </div>{" "}
                        <div className="absolute right-2 flex items-center gap-2">
                          {model.capabilities?.map((cap) => {
                            const Icon = capabilityIconMap[cap];
                            const colors = capabilityColorMap[cap];
                            const tip = capabilityTooltipMap[cap];
                            if (!Icon || !colors || !tip) return null;
                            return (
                              <CapabilityBadge
                                key={cap}
                                icon={Icon}
                                colorDark={colors.colorDark}
                                colorLight={colors.colorLight}
                                tooltip={tip}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Show All View - Card Grid Layout with Scrollable Content
                <div className="relative h-full overflow-hidden">
                  <div className="scrollbar-hide h-full overflow-y-auto px-4 py-4">
                    {/* Favorites Section Header */}
                    <div className="mb-4 flex w-full items-center gap-2 text-sm font-medium text-[#f5d0fe]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4"
                      >
                        <path d="M12 17v5"></path>
                        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path>
                      </svg>
                      Favorites
                    </div>
                    {/* Favorites Model Cards Grid - First Row (5 models) */}
                    <div className="mb-4 grid grid-cols-5 gap-4">
                      {filteredModels.slice(0, 5).map((model) => (
                        <div key={model.id} className="group relative">
                          <button
                            className="group relative flex h-[9.25rem] w-[6.75rem] cursor-pointer flex-col items-center justify-between overflow-hidden rounded-xl border border-[#322028] bg-black px-3 py-3 text-[#E7D0DD] transition-colors hover:bg-[#1a1a1a]"
                            onClick={() => {
                              onModelChange(model);
                              closeDropdown();
                            }}
                          >
                            {/* Top Section - Icon */}
                            <div className="flex h-6 w-6 items-center justify-center text-[#E7D0DD]">
                              {getModelIcon(model.id, "small")}
                            </div>{" "}
                            {/* Middle Section - Model Name */}
                            <div className="flex flex-1 items-center justify-center px-1 text-center">
                              <div className="text-sm leading-tight font-medium text-[#E7D0DD]">
                                {model.name}
                              </div>
                            </div>
                            {/* Bottom Section - Capability Icons */}
                            <div className="flex items-center justify-center gap-1">
                              {model.capabilities &&
                                model.capabilities.length > 0 && (
                                  <div
                                    className={`flex items-center justify-center gap-1 ${
                                      model.capabilities.length === 4
                                        ? "grid grid-cols-2 gap-1"
                                        : "flex flex-wrap justify-center"
                                    }`}
                                  >
                                    {model.capabilities.map((cap) => {
                                      const Icon = capabilityIconMap[cap];
                                      const colors = capabilityColorMap[cap];
                                      const tooltip = capabilityTooltipMap[cap];
                                      if (!Icon || !colors) return null;
                                      return (
                                        <Tooltip key={cap}>
                                          <TooltipTrigger asChild>
                                            <div
                                              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm"
                                              style={{
                                                backgroundColor:
                                                  colors.colorLight,
                                                color: colors.colorDark,
                                              }}
                                            >
                                              <Icon className="h-3.5 w-3.5" />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent sideOffset={4}>
                                            {tooltip}
                                          </TooltipContent>
                                        </Tooltip>
                                      );
                                    })}
                                  </div>
                                )}
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>{" "}
                    {/* Favorites Second Row (remaining models) */}
                    {filteredModels.length > 5 && (
                      <div className="mb-6 grid grid-cols-5 gap-4">
                        {filteredModels.slice(5).map((model) => (
                          <div key={model.id} className="group relative">
                            <button
                              className="group relative flex h-[9.25rem] w-[6.75rem] cursor-pointer flex-col items-center justify-between overflow-hidden rounded-xl border border-[#322028] bg-black px-3 py-3 text-[#E7D0DD] transition-colors hover:bg-[#1a1a1a]"
                              onClick={() => {
                                onModelChange(model);
                                closeDropdown();
                              }}
                            >
                              {/* Top Section - Icon */}
                              <div className="flex h-6 w-6 items-center justify-center text-[#E7D0DD]">
                                {getModelIcon(model.id, "small")}
                              </div>
                              {/* Middle Section - Model Name */}
                              <div className="flex flex-1 items-center justify-center px-1 text-center">
                                <div className="text-sm leading-tight font-medium text-[#E7D0DD]">
                                  {model.name}
                                </div>
                              </div>
                              {/* Bottom Section - Capability Icons */}
                              <div className="flex items-center justify-center gap-1">
                                {model.capabilities &&
                                  model.capabilities.length > 0 && (
                                    <div
                                      className={`flex items-center justify-center gap-1 ${
                                        model.capabilities.length === 4
                                          ? "grid grid-cols-2 gap-1"
                                          : "flex flex-wrap justify-center"
                                      }`}
                                    >
                                      {model.capabilities.map((cap) => {
                                        const Icon = capabilityIconMap[cap];
                                        const colors = capabilityColorMap[cap];
                                        const tooltip =
                                          capabilityTooltipMap[cap];
                                        if (!Icon || !colors) return null;
                                        return (
                                          <Tooltip key={cap}>
                                            <TooltipTrigger asChild>
                                              <div
                                                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm"
                                                style={{
                                                  backgroundColor:
                                                    colors.colorLight,
                                                  color: colors.colorDark,
                                                }}
                                              >
                                                <Icon className="h-3.5 w-3.5" />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent sideOffset={4}>
                                              {tooltip}
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      })}
                                    </div>
                                  )}
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Other Models Section */}
                    {filteredOtherModels.length > 0 && (
                      <>
                        {/* Other Section Header */}
                        <div className="mb-4 flex w-full items-center gap-2 text-sm font-medium text-[#f5d0fe]">
                          <Brain className="size-4" />
                          Other
                        </div>{" "}
                        {/* Other Model Cards Grid */}
                        <div className="grid grid-cols-5 gap-4">
                          {filteredOtherModels.map((model) => (
                            <div key={model.id} className="group relative">
                              <button
                                className="group relative flex h-[9.25rem] w-[6.75rem] cursor-pointer flex-col items-center justify-between overflow-hidden rounded-xl border border-[#322028] bg-black px-3 py-3 text-[#E7D0DD] transition-colors hover:bg-[#1a1a1a]"
                                onClick={() => {
                                  onModelChange(model);
                                  closeDropdown();
                                }}
                              >
                                {/* Top Section - Icon */}
                                <div className="flex h-6 w-6 items-center justify-center text-[#E7D0DD]">
                                  {getModelIcon(model.id, "small")}
                                </div>

                                {/* Middle Section - Model Name */}
                                <div className="flex flex-1 items-center justify-center px-1 text-center">
                                  <div className="text-sm leading-tight font-medium text-[#E7D0DD]">
                                    {model.name}
                                  </div>
                                </div>

                                {/* Bottom Section - Capability Icons */}
                                <div className="flex items-center justify-center gap-1">
                                  {model.capabilities &&
                                    model.capabilities.length > 0 && (
                                      <div
                                        className={`flex items-center justify-center gap-1 ${
                                          model.capabilities.length === 4
                                            ? "grid grid-cols-2 gap-1"
                                            : "flex flex-wrap justify-center"
                                        }`}
                                      >
                                        {model.capabilities.map((cap) => {
                                          const Icon = capabilityIconMap[cap];
                                          const colors =
                                            capabilityColorMap[cap];
                                          const tooltip =
                                            capabilityTooltipMap[cap];
                                          if (!Icon || !colors) return null;
                                          return (
                                            <Tooltip key={cap}>
                                              <TooltipTrigger asChild>
                                                <div
                                                  className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-sm"
                                                  style={{
                                                    backgroundColor:
                                                      colors.colorLight,
                                                    color: colors.colorDark,
                                                  }}
                                                >
                                                  <Icon className="h-3.5 w-3.5" />
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent sideOffset={4}>
                                                {tooltip}
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        })}
                                      </div>
                                    )}
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Search Header */}
            <div
              className="absolute inset-x-0 top-0 rounded-t-lg px-3.5 pt-0.5"
              style={{ backgroundColor: "#100A0E" }}
            >
              <div className="flex items-center">
                <Search className="mr-3 ml-px size-4 text-white/75" />
                <input
                  role="searchbox"
                  aria-label="Search threads"
                  placeholder="Search models..."
                  className="text-foreground w-full bg-transparent py-2 text-sm placeholder-white/50 placeholder:select-none focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div
                className="border-b px-3"
                style={{ borderColor: "#322028" }}
              ></div>
            </div>
            {/* Footer Controls */}
            <div
              className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-b-lg pt-1.5 pr-2.5 pb-1 pl-1"
              style={{ backgroundColor: "#100A0E" }}
            >
              <div
                className="absolute inset-x-3 top-0 border-b"
                style={{ borderColor: "#322028" }}
              ></div>
              {viewMode === "favorites" ? (
                <button
                  className="focus-visible:ring-ring hover:bg-muted/40 hover:text-foreground flex h-9 items-center justify-center gap-2 rounded-md px-4 py-2 pl-2 text-sm font-medium whitespace-nowrap text-white transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  onClick={() => {
                    setTimeout(() => {
                      setViewMode("all");
                    }, 100);
                  }}
                >
                  <ChevronUp className="h-4 w-4 text-white" />
                  Show all
                </button>
              ) : (
                <button
                  className="focus-visible:ring-ring hover:bg-muted/40 hover:text-foreground flex h-9 items-center justify-center gap-2 rounded-md px-4 py-2 pl-2 text-sm font-medium whitespace-nowrap text-white transition-colors focus-visible:ring-1 focus-visible:outline-none"
                  onClick={() => {
                    setTimeout(() => {
                      setViewMode("favorites");
                    }, 100);
                  }}
                >
                  <ChevronDown className="h-4 w-4 text-white" />
                  Favorites
                </button>
              )}

              <button className="focus-visible:ring-ring hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 relative inline-flex h-8 items-center justify-center gap-2 rounded-md px-2 text-xs font-medium whitespace-nowrap text-white transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent">
                <Filter className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
