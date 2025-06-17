export interface OpenRouterModel {
  id: string;
  name: string;
  contextLength: number;
  provider: string;
  capabilities?: string[]; // e.g. ['vision','search','pdf','reasoning','image']
}

export const AVAILABLE_MODELS: OpenRouterModel[] = [
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    contextLength: 1048576,
    provider: "Google",
    capabilities: ["vision", "search", "pdf"],
  },
  {
    id: "google/gemini-2.5-pro",
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
