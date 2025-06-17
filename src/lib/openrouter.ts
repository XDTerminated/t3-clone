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
    id: "openai/gpt-4o-mini",
    name: "GPT ImageGen",
    contextLength: 128000,
    provider: "OpenAI",
    capabilities: ["vision", "image"],
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
    id: "deepseek/deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 (Llama Distilled)",
    contextLength: 65536,
    provider: "DeepSeek",
    capabilities: ["reasoning"],
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
    } // If search is enabled, use the web plugin
    let actualModel = model;
    let plugins:
      | Array<{
          id: string;
          max_results?: number;
          search_prompt?: string;
          pdf?: {
            engine?: string;
          };
        }>
      | undefined;
    if (options?.searchEnabled) {
      // Use the :online suffix for models with search capability
      if (
        model.includes("gemini") ||
        model.includes("gpt") ||
        model.includes("claude")
      ) {
        actualModel = `${model}:online`;
      } else {
        // Fallback to web plugin approach
        plugins = [
          {
            id: "web",
            max_results: 5,
            search_prompt: `A web search was conducted on ${new Date().toLocaleDateString()}. Incorporate the following web search results into your response. IMPORTANT: Cite them using markdown links named using the domain of the source. Example: [example.com](https://example.com/page).`,
          },
        ];
      }
    } // Add PDF processing plugin if any PDF files are present
    const hasPDFFiles = options?.files?.some(
      (file) =>
        (file.serverData as { type: string })?.type === "application/pdf",
    );
    if (hasPDFFiles) {
      const pdfPlugin = {
        id: "file-parser",
        pdf: {
          engine: "pdf-text", // Use free text extraction engine by default
        },
      };

      if (plugins) {
        plugins.push(pdfPlugin);
      } else {
        plugins = [pdfPlugin];
      }
    }
    const requestBody: {
      model: string;
      messages: Array<{
        role: "system" | "user" | "assistant";
        content: string | MessageContent[];
        annotations?: Record<string, unknown>;
      }>;
      stream: boolean;
      temperature: number;
      max_tokens: number;
      plugins?: Array<{
        id: string;
        max_results?: number;
        search_prompt?: string;
        pdf?: {
          engine?: string;
        };
      }>;
    } = {
      model: actualModel,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    };

    if (plugins) {
      requestBody.plugins = plugins;
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
}
