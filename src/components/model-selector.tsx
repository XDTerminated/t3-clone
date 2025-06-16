"use client";

import { useState } from "react";
import {
  ChevronDown,
  Search,
  ChevronUp,
  Filter,
  Info,
  Eye,
  Globe,
  FileText,
  Brain,
  ImagePlus,
  Gem,
} from "lucide-react";
import { AVAILABLE_MODELS, type OpenRouterModel } from "~/lib/openrouter";

interface ModelSelectorProps {
  selectedModel: OpenRouterModel;
  onModelChange: (model: OpenRouterModel) => void;
}

// Model icons mapping
const getModelIcon = (modelId: string) => {
  if (modelId.includes("gemini")) {
    return (
      <svg
        className="text-color-heading size-4"
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
        className="text-color-heading size-4"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <title>DeepSeek</title>
        <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"></path>
      </svg>
    );
  } else if (modelId.includes("llama")) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="118 120 480 480"
        fill="currentColor"
        className="text-color-heading size-4"
      >
        <path d="M304.246 295.411V249.828C304.246 245.989 305.687 243.109 309.044 241.191L400.692 188.412C413.167 181.215 428.042 177.858 443.394 177.858C500.971 177.858 537.44 222.482 537.44 269.982C537.44 273.34 537.44 277.179 536.959 281.018L441.954 225.358C436.197 222 430.437 222 424.68 225.358L304.246 295.411ZM518.245 472.945V364.024C518.245 357.304 515.364 352.507 509.608 349.149L389.174 279.096L428.519 256.543C431.877 254.626 434.757 254.626 438.115 256.543L529.762 309.323C556.154 324.679 573.905 357.304 573.905 388.971C573.905 425.436 552.315 459.024 518.245 472.941V472.945ZM275.937 376.982L236.592 353.952C233.235 352.034 231.794 349.154 231.794 345.315V239.756C231.794 188.416 271.139 149.548 324.4 149.548C344.555 149.548 363.264 156.268 379.102 168.262L284.578 222.964C278.822 226.321 275.942 231.119 275.942 237.838V376.986L275.937 376.982ZM360.626 425.922L304.246 394.255V327.083L360.626 295.416L417.002 327.083V394.255L360.626 425.922ZM396.852 571.789C376.698 571.789 357.989 565.07 342.151 553.075L436.674 498.374C442.431 495.017 445.311 490.219 445.311 483.499V344.352L485.138 367.382C488.495 369.299 489.936 372.179 489.936 376.018V481.577C489.936 532.917 450.109 571.785 396.852 571.785V571.789ZM283.134 464.79L191.486 412.01C165.094 396.654 147.343 364.029 147.343 332.362C147.343 295.416 169.415 262.309 203.48 248.393V357.791C203.48 364.51 206.361 369.308 212.117 372.665L332.074 442.237L292.729 464.79C289.372 466.707 286.491 466.707 283.134 464.79ZM277.859 543.48C223.639 543.48 183.813 502.695 183.813 452.314C183.813 448.475 184.294 444.636 184.771 440.797L279.295 495.498C285.051 498.856 290.812 498.856 296.568 495.498L417.002 425.927V471.509C417.002 475.349 415.562 478.229 412.204 480.146L320.557 532.926C308.081 540.122 293.206 543.48 277.854 543.48H277.859ZM396.852 600.576C454.911 600.576 503.37 559.313 514.41 504.612C568.149 490.696 602.696 440.315 602.696 388.976C602.696 355.387 588.303 322.762 562.392 299.25C564.791 289.173 566.231 279.096 566.231 269.024C566.231 200.411 510.571 149.067 446.274 149.067C433.322 149.067 420.846 150.984 408.37 155.305C386.775 134.192 357.026 120.758 324.4 120.758C266.342 120.758 217.883 162.02 206.843 216.721C153.104 230.637 118.557 281.018 118.557 332.357C118.557 365.946 132.95 398.571 158.861 422.083C156.462 432.16 155.022 442.237 155.022 452.309C155.022 520.922 210.682 572.266 274.978 572.266C287.931 572.266 300.407 570.349 312.883 566.028C334.473 587.141 364.222 600.576 396.852 600.576Z"></path>
      </svg>
    );
  } else if (modelId.includes("claude") || modelId.includes("anthropic")) {
    return (
      <svg
        className="text-color-heading size-4"
        viewBox="0 0 46 32"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <title>Anthropic</title>
        <path d="M32.73 0h-6.945L38.45 32h6.945L32.73 0ZM12.665 0 0 32h7.082l2.59-6.72h13.25l2.59 6.72h7.082L19.929 0h-7.264Zm-.702 19.337 4.334-11.246 4.334 11.246h-8.668Z"></path>
      </svg>
    );
  }
  // Default icon for other models
  return <Brain className="text-color-heading size-4" />;
};

// Capability badges
const CapabilityBadge = ({
  icon: Icon,
  colorDark,
  colorLight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  colorDark: string;
  colorLight: string;
}) => (
  <div
    className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md text-[--color] dark:text-[--color-dark]"
    style={
      {
        "--color-dark": colorDark,
        "--color": colorLight,
      } as React.CSSProperties
    }
  >
    <div className="absolute inset-0 bg-current opacity-20 dark:opacity-15"></div>
    <Icon className="h-4 w-4" />
  </div>
);

export function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredModels = AVAILABLE_MODELS.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="relative">
      <button
        className="text-secondary-foreground hover:bg-secondary/50 active:bg-secondary/70 flex items-center gap-2 rounded-lg bg-transparent px-1 py-2 transition-colors"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-medium">{selectedModel.name}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />{" "}
          {/* Dropdown Content */}{" "}
          <div
            className="text-popover-foreground outline-chat-border/20 absolute bottom-full left-0 z-50 mb-2 max-h-[568px] w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border-none p-0 pt-10 pb-11 shadow-md outline-1 transition-all duration-200 dark:outline-white/5"
            style={{ backgroundColor: "#100A0E" }}
          >
            {" "}
            <div className="scroll-shadow max-h-full overflow-y-scroll px-1.5">
              {/* Available Models */}
              {filteredModels.map((model, index) => {
                const isFirst = index === 0;

                return (
                  <div
                    key={model.id}
                    role="menuitem"
                    className={`focus:bg-accent/30 focus:text-accent-foreground group relative flex flex-col items-start gap-1 rounded-sm p-3 text-sm transition-colors outline-none select-none ${
                      isFirst
                        ? "cursor-default"
                        : "cursor-not-allowed hover:!bg-transparent [&>*:not(.preserve-hover)]:opacity-50"
                    }`}
                    onClick={() => {
                      if (isFirst) {
                        onModelChange(model);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div
                        className={`text-muted-foreground flex items-center gap-2 pr-2 font-medium transition-colors ${!isFirst ? "opacity-50" : ""}`}
                      >
                        {getModelIcon(model.id)}
                        <span className="w-fit">{model.name}</span>
                        {!isFirst && model.provider === "Anthropic" && (
                          <Gem className="size-3 text-[--model-muted]" />
                        )}
                        <button className="p-1.5">
                          <Info className="text-color-heading size-3" />
                        </button>
                      </div>{" "}
                      <div className="flex items-center gap-2">
                        <CapabilityBadge
                          icon={Eye}
                          colorDark="hsl(168 54% 74%)"
                          colorLight="hsl(168 54% 52%)"
                        />
                        <CapabilityBadge
                          icon={Globe}
                          colorDark="hsl(208 56% 74%)"
                          colorLight="hsl(208 56% 52%)"
                        />
                        <CapabilityBadge
                          icon={FileText}
                          colorDark="hsl(237 75% 77%)"
                          colorLight="hsl(237 55% 57%)"
                        />
                        {model.id.includes("deepseek") && (
                          <CapabilityBadge
                            icon={Brain}
                            colorDark="hsl(263 58% 75%)"
                            colorLight="hsl(263 58% 53%)"
                          />
                        )}
                        {!isFirst && model.provider === "OpenAI" && (
                          <CapabilityBadge
                            icon={ImagePlus}
                            colorDark="hsl(12 60% 60%)"
                            colorLight="hsl(12 60% 45%)"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>{" "}
            {/* Search Header */}
            <div
              className="absolute inset-x-0 top-0 rounded-t-lg px-3.5 pt-0.5"
              style={{ backgroundColor: "#100A0E" }}
            >
              <div className="flex items-center">
                <Search className="text-muted-foreground/75 mr-3 ml-px size-4" />
                <input
                  role="searchbox"
                  aria-label="Search threads"
                  placeholder="Search models..."
                  className="text-foreground placeholder-muted-foreground/50 w-full bg-transparent py-2 text-sm placeholder:select-none focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div
                className="border-b px-3"
                style={{ borderColor: "#322028" }}
              ></div>
            </div>
            {/* Footer Controls */}{" "}
            <div
              className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-b-lg pt-1.5 pr-2.5 pb-1 pl-1"
              style={{ backgroundColor: "#100A0E" }}
            >
              <div
                className="absolute inset-x-3 top-0 border-b"
                style={{ borderColor: "#322028" }}
              ></div>
              <button className="focus-visible:ring-ring hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 text-muted-foreground flex h-9 items-center justify-center gap-2 rounded-md px-4 py-2 pl-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent">
                <ChevronUp className="h-4 w-4" />
                Show all
              </button>
              <button className="focus-visible:ring-ring hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 text-muted-foreground relative inline-flex h-8 items-center justify-center gap-2 rounded-md px-2 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
