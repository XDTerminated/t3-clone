import type { UploadFileResponse } from "../types";
import type { MessageContent, ChatStreamOptions, ChatMessage } from "./types";
import { DEFAULT_MODEL } from "./models";

export class OpenRouterAPI {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateChatStream(
    messages: ChatMessage[],
    model: string = DEFAULT_MODEL.id,
    options?: ChatStreamOptions,
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
        ];

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

        lastMessage.content = messageContent;
      }
    }

    let actualModel = model;
    let tools:
      | Array<{ type: "function"; function: { name: string } }>
      | undefined;

    if (options?.searchEnabled) {
      if (model.includes("gemini")) {
        actualModel = `${model}:online`;
      } else {
        tools = [
          {
            type: "function",
            function: { name: "web_search" },
          },
        ];
      }
    }

    const requestBody: {
      model: string;
      messages: ChatMessage[];
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
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "T3 Clone Chat App",
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
    const messages = [{ role: "user" as const, content: prompt }];

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
      choices: Array<{ message: { content: string } }>;
    };

    const content = result.choices[0]?.message?.content ?? "";

    const urlRegex = /https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|svg)/gi;
    const imageUrls = content.match(urlRegex) ?? [];

    if (imageUrls.length > 0) {
      return { data: imageUrls.map((url) => ({ url })) };
    }

    const genericUrlRegex = /https?:\/\/[^\s"'()]+/gi;
    const genericUrls = content.match(genericUrlRegex) ?? [];

    if (genericUrls.length > 0) {
      return {
        data: genericUrls.map((url) => ({ url: url.replace(/[.,;!?]$/, "") })),
      };
    }

    throw new Error(
      `No image URL found in response: ${content.slice(0, 200)}...`,
    );
  }
}
