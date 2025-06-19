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
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    contextLength: 1048576,
    provider: "Google",
    capabilities: ["vision", "search", "pdf", "files"],
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
    capabilities: ["vision", "reasoning", "thinking"],
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
    id: "google/gemini-flash-1.5",
    name: "Gemini Flash 1.5",
    contextLength: 1048576,
    provider: "Google",
    capabilities: ["vision", "search", "pdf", "files", "reasoning"],
  },
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick",
    contextLength: 128000,
    provider: "Meta",
    capabilities: [],
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    contextLength: 128000,
    provider: "OpenAI",
    capabilities: ["vision", "files", "reasoning"],
  },
  {
    id: "sarvam/sarvam-m",
    name: "Sarvam M",
    contextLength: 32768,
    provider: "Sarvam",
    capabilities: ["vision", "search"],
  },
];

// All available models combined for UI display
export const ALL_MODELS = [
  ...GEMINI_MODELS,
  ...GROQ_MODELS,
  ...OPENROUTER_MODELS,
];

// Free models section (rename OTHER_MODELS to FREE_MODELS)
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

// Helper functions to identify model types
export function isGeminiModel(modelId: string): boolean {
  return GEMINI_MODELS.some((model) => model.id === modelId);
}

export function isImageGenerationModel(modelId: string): boolean {
  return modelId === "gemini-2.0-flash-preview-image-generation";
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
    if (options?.searchEnabled) {
      // Use new SDK with Google Search grounding
      return this.generateWithSearch(messages, modelId, options);
    } else {
      // Use legacy SDK for regular requests
      return this.generateWithoutSearch(messages, modelId, options);
    }
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
      const contents = this.convertMessagesForNewSDK(messages); // Define the grounding tool exactly as in Google docs
      const groundingTool = {
        googleSearch: {},
      };

      // Configure generation settings
      const config: {
        tools: Array<{ googleSearch: Record<string, never> }>;
        thinkingConfig?: {
          thinkingBudget?: number;
          includeThoughts?: boolean;
        };
      } = {
        tools: [groundingTool],
      }; // Add thinking configuration if model supports it (always enable for thinking-capable models)
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
    },
  ): Promise<Response> {
    try {
      // Convert messages to the format expected by new SDK
      const contents = this.convertMessagesForNewSDK(messages); // Configure thinking settings (always enabled for thinking-capable models)
      const config: {
        thinkingConfig?: {
          thinkingBudget?: number;
          includeThoughts?: boolean;
        };
      } = {};

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
      "gemini-2.0-flash-thinking-exp",
      "gemini-2.5-flash-preview-05-20",
      "gemini-2.5-pro-preview-06-05",
    ];
    return thinkingModels.includes(modelId);
  }

  private mapToGeminiModelName(modelId: string): string {
    // Map our model IDs to actual Gemini model names
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
  private convertMessagesForNewSDK(
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string | MessageContent[];
    }>,
  ): string {
    // According to Google docs, for Google Search grounding, we pass a user prompt as a simple string
    // Get the latest user message for the search query
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();

    if (lastUserMessage) {
      return typeof lastUserMessage.content === "string"
        ? lastUserMessage.content
        : (lastUserMessage.content[0]?.text ?? "");
    }

    // Fallback: return empty string
    return "";
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
        "HTTP-Referer": "http://localhost:3000", // Optional: for analytics
        "X-Title": "T3 Clone Chat App", // Optional: for analytics
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
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "T3 Clone Chat App",
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
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "T3 Clone Chat App",
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
    _options?: {
      searchEnabled?: boolean;
      files?: UploadFileResponse[];
      thinkingEnabled?: boolean;
      thinkingBudget?: number;
    },
  ): Promise<Response> {
    // Convert messages to Groq format
    const groqMessages = messages.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : this.convertContentToText(msg.content),
    }));

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
