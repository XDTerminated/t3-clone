/**
 * @deprecated Import from '~/lib/api' instead
 * This file re-exports from the new modular API structure for backward compatibility
 */
export {
  // Types
  type MessageContent,
  type OpenRouterModel,
  type ChatStreamOptions,
  type ChatMessage,
  // Models
  GEMINI_MODELS,
  GROQ_MODELS,
  OPENROUTER_MODELS,
  FREE_MODELS,
  OTHER_MODELS,
  ALL_MODELS,
  MODEL_GROUPS,
  DEFAULT_MODEL,
  // Helpers
  isGeminiModel,
  isGroqModel,
  isImageGenerationModel,
  modelSupportsThinking,
  // API Classes
  GeminiAPI,
  OpenRouterAPI,
  GoogleGeminiAPI,
  GroqAPI,
} from "./api";
