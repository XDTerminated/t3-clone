import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";

type UploadFileResponse<T = unknown> = {
  name: string;
  size: number;
  key: string;
  url: string;
  serverData: T;
};

interface MessageContent {
  type: "text" | "image_url" | "file";
  text?: string;
  image_url?: { url: string };
  file?: { filename: string; file_data: string };
}

export interface OpenRouterModel {
  id: string;
  name: string;
  contextLength: number;
  provider: string;
  capabilities?: string[]; // e.g. ['vision','search','pdf','reasoning','image']
}

// Gemini models that will use the official Google SDK
export const GEMINI_MODELS: OpenRouterModel[] = [
  {
    id: "gemini-2.5-flash-image-preview",
    name: "Gemini 2.5 Flash Image",
    contextLength: 1048576,
    provider: "Google",
    capabilities: ["image"],
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    contextLength: 1048576,
    provider: "Google",
    capabilities: ["vision", "search", "pdf", "files"],
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    contextLength: 2097152,
    provider: "Google",
    capabilities: ["vision", "search", "pdf", "files", "reasoning"],
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

// All available models combined for UI display
export const ALL_MODELS = [
  ...GEMINI_MODELS,
  ...GROQ_MODELS,
  ...OPENROUTER_MODELS,
];

// Function to get all models including custom ones
export function getAllModelsWithCustom(customModels: string[] = []): OpenRouterModel[] {
  const customOpenRouterModels: OpenRouterModel[] = customModels.map(modelId => ({
    id: modelId,
    name: modelId.split('/').pop() || modelId, // Use the last part after '/' as name
    contextLength: 128000, // Default context length
    provider: "Custom",
    capabilities: ["reasoning"], // Default capabilities
  }));

  return [
    ...ALL_MODELS,
    ...customOpenRouterModels,
  ];
}

// Partner models section
export const PARTNER_MODELS: OpenRouterModel[] = [
  {
    id: "deepseek/deepseek-chat-v3.1:nitro",
    name: "DeepSeek-v3.1",
    contextLength: 163840,
    provider: "DeepSeek",
    capabilities: ["reasoning"],
  },
  {
    id: "openai/gpt-oss-120b:nitro",
    name: "GPT-OSS-120B",
    contextLength: 128000,
    provider: "OpenAI",
    capabilities: ["reasoning"],
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct:nitro",
    name: "Qwen3 Next-80B",
    contextLength: 131072,
    provider: "Qwen",
    capabilities: ["reasoning"],
  },
  {
    id: "qwen/qwen3-coder",
    name: "Qwen3 Coder",
    contextLength: 131072,
    provider: "Qwen",
    capabilities: ["reasoning"],
  },
  {
    id: "moonshotai/kimi-k2-0905:nitro",
    name: "Kimi K2",
    contextLength: 200000,
    provider: "Moonshot",
    capabilities: [],
  },
  {
    id: "nousresearch/hermes-4-405b",
    name: "Hermes-4 405B",
    contextLength: 200000,
    provider: "NousResearch",
    capabilities: ["reasoning"],
  },
  {
    id: "z-ai/glm-4.5v",
    name: "GLM-4.5",
    contextLength: 131072,
    provider: "Z.AI",
    capabilities: ["reasoning"],
  },
  {
    id: "openai/gpt-5-chat",
    name: "ChatGPT-5",
    contextLength: 200000,
    provider: "OpenAI",
    capabilities: ["reasoning", "vision"],
  },
];

// Models grouped by provider for the dropdown UI (partner models first)
export const MODEL_GROUPS = {
  partner: PARTNER_MODELS,
  gemini: GEMINI_MODELS,
  groq: GROQ_MODELS,
  openrouter: OPENROUTER_MODELS,
};

// Function to get model groups including custom models
export function getModelGroupsWithCustom(customModels: string[] = []) {
  const customOpenRouterModels: OpenRouterModel[] = customModels.map(modelId => ({
    id: modelId,
    name: modelId.split('/').pop() || modelId, // Use the last part after '/' as name
    contextLength: 128000, // Default context length
    provider: "Custom",
    capabilities: ["reasoning"], // Default capabilities
  }));

  const groups = {
    partner: PARTNER_MODELS,
    gemini: GEMINI_MODELS,
    groq: GROQ_MODELS,
    openrouter: OPENROUTER_MODELS,
  };

  if (customOpenRouterModels.length > 0) {
    return {
      ...groups,
      custom: customOpenRouterModels,
    };
  }

  return groups;
}

// Legacy export for backward compatibility
export const OTHER_MODELS = PARTNER_MODELS;
export const FREE_MODELS = PARTNER_MODELS; // Alias for backward compatibility

export const DEFAULT_MODEL = PARTNER_MODELS[2]!; // Qwen3 Next-80B as default

// Helper functions to identify model types
export function isGeminiModel(modelId: string): boolean {
  return GEMINI_MODELS.some((model) => model.id === modelId);
}

export function isImageGenerationModel(modelId: string): boolean {
  return modelId === "gemini-2.5-flash-image-preview";
}

// Gemini API using the official Google Generative AI SDK
export class GeminiAPI {
  private genAI: GoogleGenAI;
  private legacyGenAI: GoogleGenerativeAI;
  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.legacyGenAI = new GoogleGenerativeAI(apiKey);
  }
  async generateChatStream(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | MessageContent[];
    }>,
    modelId: string,
    options?: {
      searchEnabled?: boolean;
      files?: UploadFileResponse[];
      thinkingEnabled?: boolean;
      thinkingBudget?: number;
    },
  ) {
    // Process files and add them to the appropriate messages if provided
    let processedMessages = [...messages];

    if (options?.files && options.files.length > 0) {
      processedMessages = await this.processFilesIntoMessages(
        processedMessages,
        options.files,
      );
    }

    if (options?.searchEnabled) {
      // Use new SDK with Google Search grounding
      return this.generateWithSearch(processedMessages, modelId, options);
    } else {
      // Use legacy SDK for regular requests
      return this.generateWithoutSearch(processedMessages, modelId, options);
    }
  }

  private async processFilesIntoMessages(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | MessageContent[];
    }>,
    files: UploadFileResponse[],
  ): Promise<
    Array<{
      role: "system" | "user" | "assistant";
      content: string | MessageContent[];
    }>
  > {
    const processedMessages = [...messages];

    // Group files by type
    const imageFiles = files.filter((file) => {
      const fileType = (file.serverData as { type: string })?.type ?? "";
      return fileType.startsWith("image/");
    });

    const documentFiles = files.filter((file) => {
      const fileType = (file.serverData as { type: string })?.type ?? "";
      return fileType === "application/pdf" || fileType.startsWith("text/");
    });

    // Add image files to the last user message
    if (imageFiles.length > 0) {
      const lastUserMessageIndex = processedMessages
        .map((m) => m.role)
        .lastIndexOf("user");
      if (lastUserMessageIndex !== -1) {
        const lastUserMessage = processedMessages[lastUserMessageIndex];
        if (lastUserMessage) {
          const messageContent: MessageContent[] = [];

          // Add existing text content
          if (typeof lastUserMessage.content === "string") {
            messageContent.push({
              type: "text",
              text: lastUserMessage.content,
            });
          } else {
            messageContent.push(...lastUserMessage.content);
          }

          // Add image files
          for (const file of imageFiles) {
            messageContent.push({
              type: "image_url",
              image_url: { url: file.url },
            });
          }

          processedMessages[lastUserMessageIndex] = {
            ...lastUserMessage,
            content: messageContent,
          };
        }
      }
    } // Add document files to the last user message
    if (documentFiles.length > 0) {
      const lastUserMessageIndex = processedMessages
        .map((m) => m.role)
        .lastIndexOf("user");
      if (lastUserMessageIndex !== -1) {
        const lastUserMessage = processedMessages[lastUserMessageIndex];
        if (lastUserMessage) {
          const messageContent: MessageContent[] = [];

          // Add existing text content
          if (typeof lastUserMessage.content === "string") {
            messageContent.push({
              type: "text",
              text: lastUserMessage.content,
            });
          } else {
            messageContent.push(...lastUserMessage.content);
          }

          // Process document files and add as file content
          for (const file of documentFiles) {
            try {
              const fileType =
                (file.serverData as { type: string })?.type ?? "";

              // Fetch the file content and convert to base64
              const response = await fetch(file.url);
              const buffer = await response.arrayBuffer();
              const base64Data = Buffer.from(buffer).toString("base64");

              messageContent.push({
                type: "file",
                file: {
                  filename: file.name,
                  file_data: `data:${fileType};base64,${base64Data}`,
                },
              });
            } catch (error) {
              console.error(`Failed to process file ${file.name}:`, error);
              // Fallback to text indication
              const existingTextIndex = messageContent.findIndex(
                (c) => c.type === "text",
              );
              if (existingTextIndex !== -1) {
                messageContent[existingTextIndex]!.text +=
                  `\n\n[Document: ${file.name} - Could not be processed]`;
              } else {
                messageContent.push({
                  type: "text",
                  text: `[Document: ${file.name} - Could not be processed]`,
                });
              }
            }
          }
          processedMessages[lastUserMessageIndex] = {
            ...lastUserMessage,
            content: messageContent,
          };
        }
      }
    }

    return processedMessages;
  }
  private async generateWithSearch(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | MessageContent[];
    }>,
    modelId: string,
    options?: {
      searchEnabled?: boolean;
      files?: UploadFileResponse[];
      thinkingEnabled?: boolean;
      thinkingBudget?: number;
    },
  ): Promise<Response> {
    try {
      // Convert messages to the format expected by new SDK
      const contents = await this.convertMessagesForNewSDK(messages, options);

      // Extract system instruction from messages
      const systemMessage = messages.find((m) => m.role === "system");
      const systemInstruction = systemMessage
        ? typeof systemMessage.content === "string"
          ? systemMessage.content
          : (systemMessage.content[0]?.text ?? "")
        : "";

      // Define the grounding tool exactly as in Google docs
      const groundingTool = {
        googleSearch: {},
      };

      // Configure generation settings
      const config: {
        tools: Array<{ googleSearch: Record<string, never> }>;
        systemInstruction?: string;
        thinkingConfig?: {
          thinkingBudget?: number;
          includeThoughts?: boolean;
        };
      } = {
        tools: [groundingTool],
      };

      // Add system instruction if present
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      // Add thinking configuration if model supports it (always enable for thinking-capable models)
      const supportsThinking = this.modelSupportsThinking(modelId);
      if (supportsThinking) {
        config.thinkingConfig = {
          includeThoughts: true, // Always include thoughts for thinking-capable models
        };

        // Set thinking budget if specified
        if (options?.thinkingBudget !== undefined) {
          config.thinkingConfig.thinkingBudget = options.thinkingBudget;
        }
      }

      // Make the request exactly as in Google docs
      const response = await this.genAI.models.generateContent({
        model: this.mapToGeminiModelName(modelId),
        contents,
        config,
      });

      // Debug: Log the actual response structure
      console.log("Gemini API response:", JSON.stringify(response, null, 2));

      // Convert to stream format for compatibility
      return this.createStreamFromNewSDKResponse(response);
    } catch (error) {
      console.error("Search-enabled generation failed:", error);
      // Fallback to legacy SDK without search
      return this.generateWithoutSearch(messages, modelId);
    }
  }
  private async generateWithoutSearch(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | MessageContent[];
    }>,
    modelId: string,
    options?: {
      searchEnabled?: boolean;
      files?: UploadFileResponse[];
      thinkingEnabled?: boolean;
      thinkingBudget?: number;
    },
  ) {
    // Check if model supports thinking - if so, always enable it
    const supportsThinking = this.modelSupportsThinking(modelId);
    const shouldUseThinking = supportsThinking; // Always use thinking for thinking-capable models

    if (shouldUseThinking) {
      // Use new SDK for thinking models with thinking always enabled
      const thinkingOptions = {
        ...options,
        thinkingEnabled: true, // Force enable thinking for thinking-capable models
      };
      return this.generateWithThinking(messages, modelId, thinkingOptions);
    } else {
      // Use legacy SDK for regular requests
      return this.generateWithLegacySDK(messages, modelId);
    }
  }
  private async generateWithThinking(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | MessageContent[];
    }>,
    modelId: string,
    options?: {
      thinkingEnabled?: boolean;
      thinkingBudget?: number;
      files?: UploadFileResponse[];
    },
  ): Promise<Response> {
    try {
      // Convert messages to the format expected by new SDK
      const contents = await this.convertMessagesForNewSDK(messages, options);

      // Extract system instruction from messages
      const systemMessage = messages.find((m) => m.role === "system");
      const systemInstruction = systemMessage
        ? typeof systemMessage.content === "string"
          ? systemMessage.content
          : (systemMessage.content[0]?.text ?? "")
        : "";

      // Configure thinking settings (always enabled for thinking-capable models)
      const config: {
        systemInstruction?: string;
        thinkingConfig?: {
          thinkingBudget?: number;
          includeThoughts?: boolean;
        };
      } = {};

      // Add system instruction if present
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      // Always enable thinking for thinking-capable models
      config.thinkingConfig = {
        includeThoughts: true,
      };

      // Set thinking budget if specified
      if (options?.thinkingBudget !== undefined) {
        config.thinkingConfig.thinkingBudget = options.thinkingBudget;
      }

      // Make the request with thinking configuration
      const response = await this.genAI.models.generateContent({
        model: this.mapToGeminiModelName(modelId),
        contents,
        config,
      });

      // Convert to stream format for compatibility
      return this.createStreamFromNewSDKResponse(response);
    } catch (error) {
      console.error("Thinking-enabled generation failed:", error);
      // Fallback to legacy SDK without thinking
      return this.generateWithLegacySDK(messages, modelId);
    }
  }

  private async generateWithLegacySDK(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | MessageContent[];
    }>,
    modelId: string,
  ) {
    // Convert to Gemini format using legacy SDK
    const { contents, systemInstruction } =
      this.convertToGeminiFormat(messages);

    // Configure the model
    const modelConfig = {
      model: this.mapToGeminiModelName(modelId),
      systemInstruction: systemInstruction,
    };

    const model = this.legacyGenAI.getGenerativeModel(modelConfig);

    // Generate stream
    const result = await model.generateContentStream({ contents });

    // Convert to compatible stream format
    return this.createCompatibleStream(result);
  }

  async generateImage(
    prompt: string,
    _model = "gemini-2.0-flash-preview-image-generation",
    _options?: {
      numberOfImages?: number;
      aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
    },
  ): Promise<{ data: Array<{ url: string }> }> {
    const model = this.legacyGenAI.getGenerativeModel({
      model: "gemini-2.0-flash-preview-image-generation",
    });

    const result = await model.generateContent([{ text: prompt }]);

    // Extract images from the response
    const images: Array<{ url: string }> = [];
    const response = result.response;

    for (const candidate of response.candidates ?? []) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          images.push({ url: dataUrl });
        }
      }
    }

    if (images.length === 0) {
      throw new Error("No images generated in response");
    }

    return { data: images };
  }
  private modelSupportsThinking(modelId: string): boolean {
    const thinkingModels = [
      "gemini-2.5-pro", // Pro version supports thinking
    ];
    return thinkingModels.includes(modelId);
  }

  private mapToGeminiModelName(modelId: string): string {
    // Map our model IDs to actual Gemini model names
    switch (modelId) {
      case "gemini-2.5-flash-image-preview":
        return "gemini-2.0-flash-preview-image-generation"; // Use existing image generation model
      case "gemini-2.5-flash":
        return "gemini-2.5-flash-preview-05-20"; // Use existing flash model
      case "gemini-2.5-pro":
        return "gemini-2.5-pro-preview-06-05"; // Use existing pro model
      default:
        return "gemini-2.5-flash-preview-05-20";
    }
  }

  private convertToGeminiFormat(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | MessageContent[];
    }>,
  ) {
    const contents = [];
    let systemInstruction = "";

    for (const message of messages) {
      if (message.role === "system") {
        systemInstruction =
          typeof message.content === "string" ? message.content : "";
        continue;
      }

      contents.push({
        role: message.role === "user" ? "user" : "model",
        parts:
          typeof message.content === "string"
            ? [{ text: message.content }]
            : this.convertMessageContent(message.content),
      });
    }

    return { contents, systemInstruction };
  }
  private convertMessageContent(content: MessageContent[]) {
    return content.map((part) => {
      if (part.type === "text") {
        return { text: part.text ?? "" };
      } else if (part.type === "image_url" && part.image_url?.url) {
        // Handle base64 images
        if (part.image_url.url.startsWith("data:")) {
          const [mimeType, data] = part.image_url.url.split(",");
          return {
            inlineData: {
              mimeType: mimeType?.split(":")[1]?.split(";")[0] ?? "image/jpeg",
              data: data ?? "",
            },
          };
        }
        return { text: `[Image: ${part.image_url.url}]` };
      }
      return { text: "" };
    });
  }
  private async convertMessagesForNewSDK(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | MessageContent[];
    }>,
    _options?: {
      files?: UploadFileResponse[];
    },
  ) {
    // Convert messages to the format expected by new SDK with proper file handling
    const contents = [];

    for (const message of messages) {
      if (message.role === "system") {
        // System messages are handled separately in the config
        continue;
      }

      const parts: Array<{
        text?: string;
        inlineData?: { mimeType: string; data: string };
      }> = [];

      // Handle content
      if (typeof message.content === "string") {
        parts.push({ text: message.content });
      } else {
        // Handle structured content (files already processed in message)
        for (const content of message.content) {
          if (content.type === "text" && content.text) {
            parts.push({ text: content.text });
          } else if (content.type === "image_url" && content.image_url?.url) {
            // Convert image URL to base64 inline data for Gemini
            try {
              let base64Data: string;
              let mimeType: string;

              if (content.image_url.url.startsWith("data:")) {
                // Extract from data URL
                const [mimeTypePart, data] = content.image_url.url.split(",");
                mimeType = mimeTypePart!
                  .replace("data:", "")
                  .replace(";base64", "");
                base64Data = data!;
              } else {
                // Fetch external image
                const response = await fetch(content.image_url.url);
                const buffer = await response.arrayBuffer();
                base64Data = Buffer.from(buffer).toString("base64");

                // Determine MIME type
                mimeType = "image/png";
                if (
                  content.image_url.url.includes(".jpg") ||
                  content.image_url.url.includes(".jpeg")
                ) {
                  mimeType = "image/jpeg";
                } else if (content.image_url.url.includes(".gif")) {
                  mimeType = "image/gif";
                } else if (content.image_url.url.includes(".webp")) {
                  mimeType = "image/webp";
                }
              }

              parts.push({
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              });
            } catch (error) {
              console.error("Failed to process image:", error);
              parts.push({ text: `[Image could not be processed]` });
            }
          } else if (content.type === "file" && content.file) {
            // Handle PDF and other file types
            try {
              if (content.file.file_data.startsWith("data:")) {
                const [mimeTypePart, base64Data] =
                  content.file.file_data.split(",");
                const mimeType = mimeTypePart!
                  .replace("data:", "")
                  .replace(";base64", "");

                parts.push({
                  inlineData: {
                    mimeType,
                    data: base64Data!,
                  },
                });
              }
            } catch (error) {
              console.error("Failed to process file:", error);
              parts.push({ text: `[File: ${content.file.filename}]` });
            }
          }
        }
      }

      contents.push({
        role: message.role === "user" ? "user" : "model",
        parts,
      });
    }

    return contents;
  }
  private async createStreamFromNewSDKResponse(
    response: unknown,
  ): Promise<Response> {
    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            // Following Google's documentation structure
            const responseObj = response as {
              candidates?: Array<{
                content?: {
                  parts?: Array<{
                    text?: string;
                    thought?: boolean;
                  }>;
                };
                groundingMetadata?: {
                  webSearchQueries?: string[];
                  groundingChunks?: Array<{
                    web?: { uri?: string; title?: string };
                  }>;
                  groundingSupports?: Array<{
                    segment?: {
                      startIndex?: number;
                      endIndex?: number;
                      text?: string;
                    };
                    groundingChunkIndices?: number[];
                  }>;
                };
              }>;
              usageMetadata?: {
                thoughtsTokenCount?: number;
                candidatesTokenCount?: number;
              };
            };

            const candidate = responseObj.candidates?.[0];
            let text = "";
            let thoughtText = "";
            const groundingMetadata = candidate?.groundingMetadata;

            // Process parts to separate thoughts and regular content
            for (const part of candidate?.content?.parts ?? []) {
              if (part.text) {
                if (part.thought) {
                  thoughtText += part.text;
                } else {
                  text += part.text;
                }
              }
            }

            console.log(
              "Grounding metadata:",
              JSON.stringify(groundingMetadata, null, 2),
            ); // Add citations if grounding metadata is available
            if (groundingMetadata && text) {
              text = addCitations(text, groundingMetadata);
            } // Send thinking content if available - stream it word by word immediately
            if (thoughtText) {
              const thoughtWords = thoughtText.split(" ");

              // Send each word immediately for real-time streaming
              for (let i = 0; i < thoughtWords.length; i++) {
                const word = thoughtWords[i];
                if (word?.trim()) {
                  const payload = JSON.stringify({
                    token: "",
                    reasoning: word + (i < thoughtWords.length - 1 ? " " : ""),
                  });
                  controller.enqueue(encoder.encode(`data: ${payload}\n\n`));

                  // Very small delay to make it feel natural but immediate
                  await new Promise((resolve) => setTimeout(resolve, 20));
                }
              }

              // Send a final reasoning chunk to signal end of thinking
              const finalReasoningPayload = JSON.stringify({
                token: "",
                reasoning: "",
              });
              controller.enqueue(
                encoder.encode(`data: ${finalReasoningPayload}\n\n`),
              );
              await new Promise((resolve) => setTimeout(resolve, 50));
            }

            if (text) {
              // Simulate streaming by chunking the response
              const words = text.split(" ");
              const chunkSize = 3; // Send 3 words at a time

              for (let i = 0; i < words.length; i += chunkSize) {
                const chunk = words.slice(i, i + chunkSize).join(" ");
                if (chunk.trim()) {
                  const payload = JSON.stringify({
                    token: chunk + (i + chunkSize < words.length ? " " : ""),
                    reasoning: "",
                  });
                  controller.enqueue(encoder.encode(`data: ${payload}\n\n`));

                  // Add a small delay to simulate real streaming
                  await new Promise((resolve) => setTimeout(resolve, 50));
                }
              }
            }

            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch (error) {
            console.error("Error in createStreamFromNewSDKResponse:", error);
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      },
    );

    // Helper function to add citations (moved outside of the class method to avoid 'this' issues)
    function addCitations(
      text: string,
      groundingMetadata: {
        groundingChunks?: Array<{
          web?: { uri?: string; title?: string };
        }>;
        groundingSupports?: Array<{
          segment?: { startIndex?: number; endIndex?: number; text?: string };
          groundingChunkIndices?: number[];
        }>;
      },
    ): string {
      const supports = groundingMetadata.groundingSupports;
      const chunks = groundingMetadata.groundingChunks;

      if (!supports || !chunks) {
        return text;
      }

      // Sort supports by end_index in descending order to avoid shifting issues when inserting
      const sortedSupports = [...supports].sort(
        (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
      );

      let modifiedText = text;

      for (const support of sortedSupports) {
        const endIndex = support.segment?.endIndex;
        if (endIndex === undefined || !support.groundingChunkIndices?.length) {
          continue;
        }

        const citationLinks = support.groundingChunkIndices
          .map((i) => {
            const uri = chunks[i]?.web?.uri;
            const title = chunks[i]?.web?.title;
            if (uri) {
              // Format citations better with proper markdown links
              const cleanTitle =
                title?.replace(/[^\w\s.-]/g, "").trim() ?? "Source";
              return `[[${i + 1}]](${uri} "${cleanTitle}")`;
            }
            return null;
          })
          .filter(Boolean);

        if (citationLinks.length > 0) {
          const citationString = ` ${citationLinks.join(" ")}`;
          modifiedText =
            modifiedText.slice(0, endIndex) +
            citationString +
            modifiedText.slice(endIndex);
        }
      }

      // Add sources list at the end
      if (chunks.length > 0) {
        modifiedText += "\n\n**Sources:**\n";
        chunks.forEach((chunk, index) => {
          if (chunk.web?.uri && chunk.web?.title) {
            const cleanTitle = chunk.web.title.replace(/[^\w\s.-]/g, "").trim();
            modifiedText += `${index + 1}. [${cleanTitle}](${chunk.web.uri})\n`;
          }
        });
      }

      return modifiedText;
    }
  }

  private async createCompatibleStream(result: {
    stream: AsyncIterable<{ text(): string }>;
  }) {
    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text: string = chunk.text();
              if (text) {
                const payload = JSON.stringify({
                  token: text,
                  reasoning: "",
                });
                controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
              }
            }
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      },
    );
  }
}

export class OpenRouterAPI {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }
  async generateChatStream(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | MessageContent[];
      annotations?: Record<string, unknown>;
    }>,
    model: string = DEFAULT_MODEL.id,
    options?: {
      searchEnabled?: boolean;
      files?: UploadFileResponse[];
      thinkingEnabled?: boolean;
      thinkingBudget?: number;
    },
  ) {
    // Process files and add them to the last user message if provided
    if (options?.files && options.files.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage &&
        lastMessage.role === "user" &&
        typeof lastMessage.content === "string"
      ) {
        const messageContent: MessageContent[] = [
          { type: "text", text: lastMessage.content },
        ]; // Process each file
        for (const file of options.files) {
          const fileType = (file.serverData as { type: string })?.type ?? "";
          const isImage = fileType.startsWith("image/");
          const isPDF = fileType === "application/pdf";

          if (isImage) {
            messageContent.push({
              type: "image_url",
              image_url: { url: file.url },
            });
          } else if (isPDF) {
            const response = await fetch(file.url);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const base64data = Buffer.from(buffer).toString("base64");

            messageContent.push({
              type: "file",
              file: {
                filename: file.name,
                file_data: `data:${fileType};base64,${base64data}`,
              },
            });
          }
        }

        // Replace the last message content with the structured content
        lastMessage.content = messageContent;
      }
    }
    // If search is enabled, use the web plugin
    let actualModel = model;
    let tools:
      | Array<{ type: "function"; function: { name: string } }>
      | undefined;

    if (options?.searchEnabled) {
      // Use the :online suffix for Gemini models as recommended by OpenRouter docs
      if (model.includes("gemini")) {
        actualModel = `${model}:online`;
      } else {
        // Use web plugin for other models
        tools = [
          {
            type: "function",
            function: {
              name: "web_search",
            },
          },
        ];
      }
    }

    // PDF files are handled by adding them to the message content.
    // The deprecated `file-parser` plugin is no longer needed.
    const requestBody: {
      model: string;
      messages: Array<{
        role: "system" | "user" | "assistant";
        content: string | MessageContent[];
        annotations?: Record<string, unknown>;
      }>;
      stream: boolean;
      tools?: typeof tools;
    } = {
      model: actualModel,
      messages,
      stream: true,
    };

    if (tools) {
      requestBody.tools = tools;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://leemerchat.com", // Optional: for analytics
        "X-Title": "LeemerChat", // Optional: for analytics
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
      );
    }

    return response;
  }
  async generateChat(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    model: string = DEFAULT_MODEL.id,
  ): Promise<{ choices: Array<{ message: { content: string } }> }> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://leemerchat.com",
        "X-Title": "LeemerChat",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        temperature: 0.3,
        max_tokens: 15,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
      );
    }
    return response.json() as Promise<{
      choices: Array<{ message: { content: string } }>;
    }>;
  }
  async generateImage(
    prompt: string,
    _model = "black-forest-labs/flux-schnell",
    _options?: {
      size?: "1024x1024" | "1792x1024" | "1024x1792";
      quality?: "standard" | "hd";
      style?: "vivid" | "natural";
    },
  ): Promise<{ data: Array<{ url: string }> }> {
    // FLUX models use chat completions for image generation
    const messages = [
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    const requestBody = {
      model: "black-forest-labs/flux-schnell",
      messages,
      max_tokens: 200,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://leemerchat.com",
        "X-Title": "LeemerChat",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `OpenRouter Image API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = (await response.json()) as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    };

    // Parse the response to extract image URLs
    const content = result.choices[0]?.message?.content ?? "";

    // Try to extract image URLs from the response
    const urlRegex = /https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg)/gi;
    const imageUrls = content.match(urlRegex) ?? [];

    if (imageUrls.length > 0) {
      return {
        data: imageUrls.map((url) => ({ url })),
      };
    }

    // If no URLs found, check if the content contains a URL pattern
    const genericUrlRegex = /https?:\/\/[^\s"'()]+/gi;
    const genericUrls = content.match(genericUrlRegex) ?? [];

    if (genericUrls.length > 0) {
      return {
        data: genericUrls.map((url) => ({ url: url.replace(/[.,;!?]$/, "") })), // Remove trailing punctuation
      };
    } // If the response doesn't contain a URL, it might be a base64 image or error message
    throw new Error(
      `No image URL found in response: ${content.slice(0, 200)}...`,
    );
  }
}

// Google Gemini API for image generation
export class GoogleGeminiAPI {
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(
    prompt: string,
    _model = "gemini-2.0-flash-preview-image-generation",
    _options?: {
      numberOfImages?: number;
      aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
    },
  ): Promise<{ data: Array<{ url: string }> }> {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    };
    const response = await fetch(
      `${this.baseUrl}/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API error details:", errorText);
      throw new Error(
        `Google Gemini API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = (await response.json()) as {
      candidates: Array<{
        content: {
          parts: Array<{
            text?: string;
            inlineData?: {
              mimeType: string;
              data: string;
            };
          }>;
        };
      }>;
    };

    // Extract images from the response
    const images: Array<{ url: string }> = [];

    for (const candidate of result.candidates ?? []) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.inlineData?.data) {
          // Convert base64 data to data URL
          const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          images.push({ url: dataUrl });
        }
      }
    }

    if (images.length === 0) {
      throw new Error("No images generated in response");
    }

    return { data: images };
  }
}

export class GroqAPI {
  private apiKey: string;
  private baseUrl = "https://api.groq.com/openai/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  async generateChatStream(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | MessageContent[];
    }>,
    model: string,
    options?: {
      searchEnabled?: boolean;
      files?: UploadFileResponse[];
      thinkingEnabled?: boolean;
      thinkingBudget?: number;
    },
  ): Promise<Response> {
    // Convert messages to Groq format and include file information as text
    const groqMessages = messages.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : this.convertContentToText(msg.content),
    }));

    // Add file information to the last user message if files are provided
    if (options?.files && options.files.length > 0) {
      const lastUserMessageIndex = groqMessages
        .map((m) => m.role)
        .lastIndexOf("user");
      if (lastUserMessageIndex !== -1) {
        const lastUserMessage = groqMessages[lastUserMessageIndex];
        if (lastUserMessage) {
          let fileInfo = "\n\nAttached files:";
          for (const file of options.files) {
            const fileType = (file.serverData as { type: string })?.type ?? "";
            fileInfo += `\n- ${file.name} (${fileType})`;
          }
          lastUserMessage.content += fileInfo;
        }
      }
    }

    const requestBody = {
      model: model,
      messages: groqMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Groq API error: ${response.status} ${response.statusText}`,
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  private convertContentToText(content: MessageContent[]): string {
    return content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join(" ");
  }
}

export function isGroqModel(modelId: string): boolean {
  const groqModels = [
    "deepseek-r1-distill-llama-70b",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "qwen/qwen3-32b",
  ];
  return groqModels.includes(modelId);
}

export function isPartnerModel(modelId: string): boolean {
  return PARTNER_MODELS.some((model) => model.id === modelId);
}

// Legacy function for backward compatibility
export function isFreeModel(modelId: string): boolean {
  return isPartnerModel(modelId);
}
