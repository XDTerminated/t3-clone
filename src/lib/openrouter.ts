export interface OpenRouterModel {
  id: string;
  name: string;
  contextLength: number;
  provider: string;
}

export const AVAILABLE_MODELS: OpenRouterModel[] = [
  {
    id: "deepseek/deepseek-chat:free",
    name: "DeepSeek V3",
    contextLength: 163840,
    provider: "DeepSeek",
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash",
    contextLength: 1048576,
    provider: "Google",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B",
    contextLength: 131072,
    provider: "Meta",
  },
  {
    id: "mistralai/mistral-nemo:free",
    name: "Mistral Nemo",
    contextLength: 131072,
    provider: "Mistral",
  },
  {
    id: "qwen/qwen-2.5-72b-instruct:free",
    name: "Qwen 2.5 72B",
    contextLength: 32768,
    provider: "Qwen",
  },
];

export const DEFAULT_MODEL = AVAILABLE_MODELS[0]!; // DeepSeek V3 as default

export class OpenRouterAPI {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateChatStream(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    model: string = DEFAULT_MODEL.id,
  ) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Optional: for analytics
        "X-Title": "T3 Clone Chat App", // Optional: for analytics
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
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
