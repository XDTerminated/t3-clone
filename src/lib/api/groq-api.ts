import type { UploadFileResponse } from "../types";
import type { MessageContent, ChatStreamOptions, ChatMessage } from "./types";

export class GroqAPI {
  private apiKey: string;
  private baseUrl = "https://api.groq.com/openai/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateChatStream(
    messages: ChatMessage[],
    model: string,
    options?: ChatStreamOptions,
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
      const errorBody = await response.text();
      console.error("Groq API error details:", errorBody);
      throw new Error(
        `Groq API error: ${response.status} ${response.statusText} - ${errorBody}`,
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
