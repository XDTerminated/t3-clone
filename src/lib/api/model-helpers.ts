import { GEMINI_MODELS, GROQ_MODELS } from "./models";

/**
 * Check if a model ID corresponds to a Gemini model
 */
export function isGeminiModel(modelId: string): boolean {
  return GEMINI_MODELS.some((model) => model.id === modelId);
}

/**
 * Check if a model ID corresponds to an image generation model
 */
export function isImageGenerationModel(modelId: string): boolean {
  return modelId === "gemini-2.0-flash-preview-image-generation";
}

/**
 * Check if a model ID corresponds to a Groq model
 */
export function isGroqModel(modelId: string): boolean {
  return GROQ_MODELS.some((model) => model.id === modelId);
}

/**
 * Check if a model supports thinking/reasoning capabilities
 * This is used both client-side and server-side
 */
export function modelSupportsThinking(modelId: string): boolean {
  const thinkingModels = [
    // Gemini thinking models
    "gemini-2.0-flash-thinking-exp",
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-pro-preview-06-05",
    // Groq thinking models
    "deepseek-r1-distill-llama-70b",
    "qwen/qwen3-32b",
  ];
  return thinkingModels.includes(modelId);
}

/**
 * Map internal model ID to the actual Gemini API model name
 */
export function mapToGeminiModelName(modelId: string): string {
  switch (modelId) {
    case "gemini-2.0-flash-exp":
      return "gemini-2.0-flash-exp";
    case "gemini-2.0-flash-thinking-exp":
      return "gemini-2.0-flash-thinking-exp";
    case "gemini-2.5-flash-preview-05-20":
      return "gemini-2.5-flash-preview-05-20";
    case "gemini-2.5-pro-preview-06-05":
      return "gemini-2.5-pro-preview-06-05";
    case "gemini-2.0-flash-preview-image-generation":
      return "gemini-2.0-flash-preview-image-generation";
    default:
      return "gemini-2.0-flash-exp";
  }
}
