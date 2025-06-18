import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "~/lib/prisma";
import { OpenRouterAPI, DEFAULT_MODEL } from "~/lib/openrouter";

// HACK: Manual type definition to avoid client-side import issues
type UploadFileResponse<T = unknown> = {
  name: string;
  size: number;
  key: string;
  url: string;
  serverData: T;
};

type ChatRequest = {
  message?: string;
  chatId?: string;
  history?: Array<{ sender: string; text: string }>;
  model?: string;
  apiKey?: string; // User's OpenRouter API key
  searchEnabled?: boolean;
  files?: UploadFileResponse[];
};

export async function POST(request: Request) {
  let promptContents: string[];
  let requestBody: ChatRequest;

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    requestBody = (await request.json()) as ChatRequest;

    // If chatId is provided, load the conversation history from database
    if (requestBody.chatId && typeof requestBody.chatId === "string") {
      try {
        // Verify the chat belongs to the user
        const chat = await prisma.chat.findFirst({
          where: { id: requestBody.chatId, userId },
        });

        if (!chat) {
          return NextResponse.json(
            { error: "Chat not found" },
            { status: 404 },
          );
        }

        // Get messages for the chat
        const messages = await prisma.message.findMany({
          where: { chatId: requestBody.chatId },
          orderBy: { createdAt: "asc" },
        });

        // Convert database messages to conversation format
        const dbHistory = messages.map((msg) => ({
          sender: msg.role === "user" ? "User" : "AI",
          text: msg.content,
        }));

        // If history is provided in body, use it (includes the new message)
        // Otherwise use database history
        const conversationHistory = requestBody.history ?? dbHistory;

        promptContents = conversationHistory
          .filter(
            (msg): msg is { sender: string; text: string } =>
              typeof msg.text === "string",
          )
          .map((msg) => `${msg.sender}: ${msg.text.trim()}`);

        if (promptContents.length === 0) {
          return NextResponse.json({ reply: "" });
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Fall back to message-only if database fails
        if (requestBody.message && typeof requestBody.message === "string") {
          const msg = requestBody.message.trim();
          if (!msg) {
            return NextResponse.json({ reply: "" });
          }
          promptContents = [`User: ${msg}`];
        } else {
          return NextResponse.json(
            { error: "Database error and no fallback message" },
            { status: 500 },
          );
        }
      }
    }
    // For now, let's keep the original logic and ignore chatId
    else if (Array.isArray(requestBody.history)) {
      promptContents = requestBody.history
        .filter(
          (msg): msg is { sender: string; text: string } =>
            typeof msg.text === "string",
        )
        .map((msg) => `${msg.sender}: ${msg.text.trim()}`);
      if (promptContents.length === 0) {
        return NextResponse.json({ reply: "" });
      }
    } else if (requestBody.message && typeof requestBody.message === "string") {
      const msg = requestBody.message.trim();
      if (!msg) {
        return NextResponse.json({ reply: "" });
      }
      promptContents = [`User: ${msg}`];
    } else {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }
  if (!requestBody.apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key is required" },
      { status: 400 },
    );
  }
  try {
    // Use the specified model or default
    const selectedModel = requestBody.model ?? DEFAULT_MODEL.id;

    // Create model-aware system prompt
    const getModelIdentity = (modelId: string) => {
      if (modelId.includes("deepseek")) {
        return "You are DeepSeek, an AI assistant created by DeepSeek. You are helpful, harmless, and honest.";
      } else if (modelId.includes("gemini")) {
        return "You are Gemini, Google's AI assistant. You are helpful, harmless, and honest.";
      } else if (modelId.includes("llama")) {
        return "You are Llama, Meta's AI assistant. You are helpful, harmless, and honest.";
      } else if (modelId.includes("mistral")) {
        return "You are Mistral AI, a helpful AI assistant created by Mistral AI.";
      } else if (modelId.includes("qwen")) {
        return "You are Qwen, an AI assistant created by Alibaba Cloud. You are helpful, harmless, and honest.";
      } else {
        return "You are a helpful AI assistant.";
      }
    };
    const openRouter = new OpenRouterAPI(requestBody.apiKey);

    // Convert conversation history to OpenRouter format
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      {
        role: "system",
        content: `${getModelIdentity(selectedModel)} Use the conversation history to provide clear, accurate, and detailed answers. Respond naturally without adding any role prefixes or labels, and only output the answer text. Follow the tone of the user.`,
      },
    ];

    // Add conversation history
    for (const content of promptContents) {
      if (content.startsWith("User: ")) {
        messages.push({
          role: "user",
          content: content.substring(6), // Remove "User: " prefix
        });
      } else if (content.startsWith("AI: ")) {
        messages.push({
          role: "assistant",
          content: content.substring(4), // Remove "AI: " prefix
        });
      }
    }
    const response = await openRouter.generateChatStream(
      messages,
      selectedModel,
      {
        searchEnabled: requestBody.searchEnabled,
        files: requestBody.files,
      },
    );

    const encoder = new TextEncoder();
    const responseStream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        try {
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Split on double newlines to separate complete SSE events
            const events = buffer.split(/\r?\n\r?\n/);
            buffer = events.pop() ?? ""; // Keep the incomplete event in buffer

            for (const event of events) {
              const lines = event.split(/\r?\n/);

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6).trim();
                  if (data === "[DONE]") {
                    console.log("Stream completed with [DONE]");
                    controller.close();
                    return;
                  }

                  if (!data) continue; // Skip empty data lines

                  try {
                    const parsed = JSON.parse(data) as {
                      choices?: Array<{
                        delta?: {
                          content?: string;
                          reasoning?: string;
                        };
                        finish_reason?: string;
                      }>;
                    };

                    const choice = parsed.choices?.[0];
                    if (!choice) continue;

                    const token = choice.delta?.content ?? "";
                    const reasoning = choice.delta?.reasoning ?? "";

                    // Log for debugging web search
                    if (requestBody.searchEnabled && (token || reasoning)) {
                      console.log("Web search streaming:", {
                        tokenLength: token.length,
                        reasoningLength: reasoning.length,
                        finishReason: choice.finish_reason,
                      });
                    }

                    if (token || reasoning) {
                      const payload = JSON.stringify({
                        token: token || "",
                        reasoning: reasoning || "",
                      });
                      controller.enqueue(
                        encoder.encode(`data: ${payload}\n\n`),
                      );
                    }
                  } catch (parseError) {
                    console.log(
                      "JSON parse error:",
                      parseError,
                      "Data:",
                      data.substring(0, 100),
                    );
                    // Skip invalid JSON lines
                    continue;
                  }
                }
              }
            }
          }

          // Process any remaining buffer content at the end
          if (buffer.trim()) {
            console.log(
              "Processing remaining buffer:",
              buffer.substring(0, 100),
            );
            const lines = buffer.split(/\r?\n/);
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data && data !== "[DONE]") {
                  try {
                    const parsed = JSON.parse(data) as {
                      choices?: Array<{
                        delta?: {
                          content?: string;
                          reasoning?: string;
                        };
                      }>;
                    };
                    const token = parsed.choices?.[0]?.delta?.content ?? "";
                    const reasoning =
                      parsed.choices?.[0]?.delta?.reasoning ?? "";
                    if (token || reasoning) {
                      const payload = JSON.stringify({
                        token: token || "",
                        reasoning: reasoning || "",
                      });
                      controller.enqueue(
                        encoder.encode(`data: ${payload}\n\n`),
                      );
                    }
                  } catch (finalError) {
                    console.log("Final buffer parse error:", finalError);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream reading error:", error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("OpenRouter API error:", err);

    // Check if it's an OpenRouter API error with specific status codes
    if (err instanceof Error && err.message.includes("OpenRouter API error:")) {
      if (err.message.includes("429")) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded. Please wait a moment and try again.",
            errorType: "RATE_LIMIT",
          },
          { status: 429 },
        );
      }

      if (err.message.includes("402")) {
        return NextResponse.json(
          {
            error:
              "Payment required. Please check your OpenRouter account balance or upgrade your plan.",
            errorType: "PAYMENT_REQUIRED",
          },
          { status: 402 },
        );
      }

      if (err.message.includes("401")) {
        return NextResponse.json(
          {
            error: "Invalid API key. Please check your OpenRouter API key.",
            errorType: "INVALID_API_KEY",
          },
          { status: 401 },
        );
      }

      if (err.message.includes("403")) {
        return NextResponse.json(
          {
            error:
              "Access forbidden. Please check your OpenRouter API key permissions.",
            errorType: "FORBIDDEN",
          },
          { status: 403 },
        );
      }
    }

    return NextResponse.json(
      { error: "Network or server error" },
      { status: 502 },
    );
  }
}
