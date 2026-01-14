import type { OpenRouterModel } from "./types";

// Gemini models that will use the official Google SDK
export const GEMINI_MODELS: OpenRouterModel[] = [
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    contextLength: 1048576,
    provider: "Google",
    capabilities: ["search"],
  },
  {
    id: "gemini-2.0-flash-lite-exp",
    name: "Gemini 2.0 Flash Lite",
    contextLength: 1048576,
    provider: "Google",
    capabilities: [],
  },
  {
    id: "gemini-2.0-flash-thinking-exp",
    name: "Gemini 2.0 Flash Thinking",
    contextLength: 1048576,
    provider: "Google",
    capabilities: ["reasoning", "thinking"],
  },
  {
    id: "gemini-2.0-flash-preview-image-generation",
    name: "Gemini 2.0 Flash Image Generation",
    contextLength: 1048576,
    provider: "Google",
    capabilities: ["image"],
  },
  {
    id: "gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    contextLength: 1048576,
    provider: "Google",
    capabilities: ["vision", "search", "pdf", "files", "thinking"],
  },
  {
    id: "gemini-2.5-pro-preview-06-05",
    name: "Gemini 2.5 Pro",
    contextLength: 2097152,
    provider: "Google",
    capabilities: ["vision", "search", "pdf", "files", "reasoning", "thinking"],
  },
];

// Groq models (free)
export const GROQ_MODELS: OpenRouterModel[] = [
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 Distill Llama 70B",
    contextLength: 128000,
    provider: "Groq",
    capabilities: ["reasoning", "thinking"],
  },
  {
    id: "meta-llama/llama-4-maverick-17b-128e-instruct",
    name: "Llama 4 Maverick 17B",
    contextLength: 131072,
    provider: "Groq",
    capabilities: [],
  },
  {
    id: "qwen/qwen3-32b",
    name: "Qwen 3 32B",
    contextLength: 32768,
    provider: "Groq",
    capabilities: ["reasoning", "thinking"],
  },
];

// OpenRouter models (requires API key)
export const OPENROUTER_MODELS: OpenRouterModel[] = [
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    contextLength: 200000,
    provider: "Anthropic",
    capabilities: ["vision", "files", "reasoning"],
  },
  {
    id: "anthropic/claude-4-sonnet",
    name: "Claude 4 Sonnet",
    contextLength: 200000,
    provider: "Anthropic",
    capabilities: ["vision", "search", "files", "reasoning"],
  },
  {
    id: "deepseek/deepseek-chat-v3",
    name: "DeepSeek Chat V3",
    contextLength: 163840,
    provider: "DeepSeek",
    capabilities: ["reasoning"],
  },
  {
    id: "deepseek/deepseek-r1-qwen3-8b",
    name: "DeepSeek R1 Qwen3 8B",
    contextLength: 32768,
    provider: "DeepSeek",
    capabilities: ["reasoning"],
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    contextLength: 128000,
    provider: "OpenAI",
    capabilities: ["vision", "files", "reasoning"],
  },
];

// Free models section
export const FREE_MODELS: OpenRouterModel[] = [
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek V3 Free",
    contextLength: 163840,
    provider: "DeepSeek",
    capabilities: ["reasoning"],
  },
  {
    id: "qwen/qwq-32b:free",
    name: "Qwen 32B Free",
    contextLength: 40000,
    provider: "Qwen",
    capabilities: ["reasoning"],
  },
  {
    id: "meta-llama/llama-4-maverick:free",
    name: "Llama 4 Maverick Free",
    contextLength: 128000,
    provider: "Meta",
    capabilities: [],
  },
  {
    id: "meta-llama/llama-4-scout:free",
    name: "Llama 4 Scout Free",
    contextLength: 200000,
    provider: "Meta",
    capabilities: [],
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B Free",
    contextLength: 131072,
    provider: "Meta",
    capabilities: [],
  },
  {
    id: "qwen/qwen3-32b:free",
    name: "Qwen3 32B Free",
    contextLength: 40960,
    provider: "Qwen",
    capabilities: [],
  },
];

// All available models combined for UI display
export const ALL_MODELS = [
  ...GEMINI_MODELS,
  ...GROQ_MODELS,
  ...OPENROUTER_MODELS,
];

// Models grouped by provider for the dropdown UI
export const MODEL_GROUPS = {
  gemini: GEMINI_MODELS,
  groq: GROQ_MODELS,
  openrouter: OPENROUTER_MODELS,
  free: FREE_MODELS,
};

// Legacy export for backward compatibility
export const OTHER_MODELS = FREE_MODELS;

export const DEFAULT_MODEL = GEMINI_MODELS[0]!; // Gemini 2.0 Flash as default
