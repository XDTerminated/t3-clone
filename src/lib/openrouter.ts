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

export const AVAILABLE_MODELS: OpenRouterModel[] = [
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash",
    contextLength: 1048576,
    provider: "Google",
    capabilities: ["vision", "search", "pdf"],
  },
  {
    id: "google/gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    contextLength: 1048576,
    provider: "Google",
    capabilities: ["vision", "search", "pdf"],
  },
  {
    id: "google/gemini-2.5-pro-preview",
    name: "Gemini 2.5 Pro",
    contextLength: 2097152,
    provider: "Google",
    capabilities: ["vision", "search", "pdf", "reasoning"],
  },
  {
    id: "gemini-2.0-flash-preview-image-generation",
    name: "Gemini Image Gen",
    contextLength: 1048576,
    provider: "Google",
    capabilities: ["image"],
  },
  {
    id: "openai/o1-mini",
    name: "o4-mini",
    contextLength: 65536,
    provider: "OpenAI",
    capabilities: ["vision", "reasoning"],
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 4 Sonnet",
    contextLength: 200000,
    provider: "Anthropic",
    capabilities: ["vision", "pdf"],
  },
  {
    id: "anthropic/claude-3.5-sonnet:beta",
    name: "Claude 4 Sonnet (Reasoning)",
    contextLength: 200000,
    provider: "Anthropic",
    capabilities: ["vision", "pdf", "reasoning"],
  },
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1",
    contextLength: 163840,
    provider: "DeepSeek",
    capabilities: ["reasoning"],
  },
];

// Additional free models for the "Other" section
export const OTHER_MODELS: OpenRouterModel[] = [
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek V3",
    contextLength: 163840,
    provider: "DeepSeek",
    capabilities: [],
  },
  {
    id: "qwen/qwq-32b:free",
    name: "Qwen 32B",
    contextLength: 40000,
    provider: "Qwen",
    capabilities: ["reasoning"],
  },
  {
    id: "meta-llama/llama-4-maverick:free",
    name: "Llama 4 Maverick",
    contextLength: 128000,
    provider: "Meta",
    capabilities: ["vision"],
  },
  {
    id: "meta-llama/llama-4-scout:free",
    name: "Llama 4 Scout",
    contextLength: 200000,
    provider: "Meta",
    capabilities: [],
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B",
    contextLength: 131072,
    provider: "Meta",
    capabilities: [],
  },
  {
    id: "qwen/qwen3-32b:free",
    name: "Qwen3 32B",
    contextLength: 40960,
    provider: "Qwen",
    capabilities: [],
  },
];

export const DEFAULT_MODEL = AVAILABLE_MODELS[0]!; // Gemini 2.5 Flash as default

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
