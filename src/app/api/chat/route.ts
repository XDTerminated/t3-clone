import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, withRetry } from "~/lib/prisma";
import {
  OpenRouterAPI,
  GeminiAPI,
  GoogleGeminiAPI,
  GroqAPI,
  DEFAULT_MODEL,
  isGeminiModel,
  isImageGenerationModel,
  isGroqModel,
} from "~/lib/openrouter";

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
  openRouterApiKey?: string; // User's OpenRouter API key
  geminiApiKey?: string; // User's Gemini API key
  groqApiKey?: string; // User's Groq API key
  searchEnabled?: boolean;
  files?: UploadFileResponse[];
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
};

// Helper function to check if a model supports thinking
function modelSupportsThinking(modelId: string): boolean {
  const thinkingModels = [
    "gemini-2.0-flash-thinking-exp",
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-pro-preview-06-05",
    "deepseek-r1-distill-llama-70b",
    "qwen/qwen3-32b",
  ];
  return thinkingModels.includes(modelId);
}

export async function POST(request: Request) {
  let promptContents: string[];
  let requestBody: ChatRequest;

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    requestBody = (await request.json()) as ChatRequest; // If chatId is provided, load the conversation history from database
    if (requestBody.chatId && typeof requestBody.chatId === "string") {
      try {
        // Verify the chat belongs to the user
        const chat = await withRetry(async () => {
          return await prisma.chat.findFirst({
            where: { id: requestBody.chatId, userId },
          });
        });

        if (!chat) {
          return NextResponse.json(
            { error: "Chat not found" },
            { status: 404 },
          );
        }

        // Get messages for the chat
        const messages = await withRetry(async () => {
          return await prisma.message.findMany({
            where: { chatId: requestBody.chatId },
            orderBy: { createdAt: "asc" },
          });
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
  } // Use the specified model or default
  const selectedModel = requestBody.model ?? DEFAULT_MODEL.id;
  // Determine which API to use based on the model
  const useGeminiAPI = isGeminiModel(selectedModel);
  const useGroqAPI = isGroqModel(selectedModel);
  const isImageGen = isImageGenerationModel(selectedModel);

  // Validate that we have the appropriate API key
  if (useGeminiAPI && !requestBody.geminiApiKey) {
    return NextResponse.json(
      { error: "Gemini API key is required for Gemini models" },
      { status: 400 },
    );
  }

  if (useGroqAPI && !requestBody.groqApiKey) {
    return NextResponse.json(
      { error: "Groq API key is required for Groq models" },
      { status: 400 },
    );
  }

  if (!useGeminiAPI && !useGroqAPI && !requestBody.openRouterApiKey) {
    return NextResponse.json(
      {
        error: "OpenRouter API key is required for non-Gemini/non-Groq models",
      },
      { status: 400 },
    );
  }
  try {
    // Check if this is an image generation request
    if (isImageGen) {
      // Handle image generation with Google Gemini
      if (!requestBody.geminiApiKey?.trim()) {
        return NextResponse.json(
          {
            error: "Google API key is required for image generation.",
          },
          { status: 400 },
        );
      }

      const geminiApi = new GoogleGeminiAPI(requestBody.geminiApiKey);

      // Get the latest user message as the image prompt
      const userPrompt =
        promptContents
          .filter((content) => content.startsWith("User: "))
          .pop()
          ?.substring(6) ?? ""; // Remove "User: " prefix

      if (!userPrompt.trim()) {
        return NextResponse.json(
          { error: "No prompt provided for image generation" },
          { status: 400 },
        );
      }

      try {
        const imageResult = await geminiApi.generateImage(userPrompt);

        if (imageResult.data && imageResult.data.length > 0) {
          const imageUrl = imageResult.data[0]?.url;

          if (imageUrl) {
            // Return the image URL in a special format that the frontend can recognize
            return NextResponse.json({
              reply: "",
              generatedImage: {
                url: imageUrl,
                prompt: userPrompt,
              },
            });
          }
        }

        return NextResponse.json(
          { error: "Failed to generate image" },
          { status: 500 },
        );
      } catch (imageError) {
        console.error("Image generation error:", imageError);
        return NextResponse.json(
          {
            error:
              "Image generation failed. Please check your Google API key and try again.",
          },
          { status: 500 },
        );
      }
    }

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
      } else if (modelId.includes("microsoft") || modelId.includes("phi")) {
        return "You are Phi, Microsoft's AI assistant. You are helpful, harmless, and honest. IMPORTANT: Do not show your internal reasoning, chain-of-thought, or thinking process in your response. Only provide the final answer directly without any internal monologue, analysis steps, or reasoning explanations.";
      } else {
        return "You are a helpful AI assistant.";
      }
    };

    // Route to appropriate API based on model
    if (useGeminiAPI) {
      // Use Gemini API for Gemini models
      const geminiApi = new GeminiAPI(requestBody.geminiApiKey!);

      // Convert conversation history to Gemini format
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
      } // For thinking-capable models, always enable thinking
      const supportsThinking = modelSupportsThinking(selectedModel);
      const response = await geminiApi.generateChatStream(
        messages,
        selectedModel,
        {
          searchEnabled: requestBody.searchEnabled,
          files: requestBody.files,
          thinkingEnabled: supportsThinking
            ? true
            : requestBody.thinkingEnabled,
          thinkingBudget: requestBody.thinkingBudget,
        },
      );
      return response;
    } else if (useGroqAPI) {
      // Use Groq API for Groq models
      const groqApi = new GroqAPI(requestBody.groqApiKey!);

      // Convert conversation history to Groq format
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

      // For thinking-capable models, always enable thinking
      const supportsThinking = modelSupportsThinking(selectedModel);
      const response = await groqApi.generateChatStream(
        messages,
        selectedModel,
        {
          searchEnabled: requestBody.searchEnabled,
          files: requestBody.files,
          thinkingEnabled: supportsThinking
            ? true
            : requestBody.thinkingEnabled,
          thinkingBudget: requestBody.thinkingBudget,
        },
      );
      const encoder = new TextEncoder();
      const responseStream = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          try {
            let buffer = "";
            let insideThinkTag = false;
            let currentThinking = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                if (line.trim() === "") continue;
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data) as {
                      choices?: Array<{
                        delta?: {
                          content?: string;
                        };
                      }>;
                    };
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content && typeof content === "string") {
                      // Check for thinking tags
                      if (content.includes("<think>")) {
                        insideThinkTag = true;
                        const thinkStart = content.indexOf("<think>");
                        if (thinkStart >= 0) {
                          // Send any content before <think> as regular token
                          const beforeThink = content.substring(0, thinkStart);
                          if (beforeThink) {
                            const payload = JSON.stringify({
                              token: beforeThink,
                              reasoning: "",
                            });
                            controller.enqueue(
                              encoder.encode(`data: ${payload}\n\n`),
                            );
                          }
                          // Start collecting thinking content
                          currentThinking += content.substring(thinkStart + 7); // Skip "<think>"
                        }
                      } else if (content.includes("</think>")) {
                        insideThinkTag = false;
                        const thinkEnd = content.indexOf("</think>");
                        if (thinkEnd >= 0) {
                          // Add content before </think> to thinking
                          currentThinking += content.substring(0, thinkEnd);
                          // Send the complete thinking
                          if (currentThinking.trim()) {
                            const payload = JSON.stringify({
                              token: "",
                              reasoning: currentThinking.trim(),
                            });
                            controller.enqueue(
                              encoder.encode(`data: ${payload}\n\n`),
                            );
                          }
                          // Send any content after </think> as regular token
                          const afterThink = content.substring(thinkEnd + 8); // Skip "</think>"
                          if (afterThink) {
                            const payload = JSON.stringify({
                              token: afterThink,
                              reasoning: "",
                            });
                            controller.enqueue(
                              encoder.encode(`data: ${payload}\n\n`),
                            );
                          }
                          currentThinking = "";
                        }
                      } else if (insideThinkTag) {
                        // We're inside thinking tags, accumulate content
                        currentThinking += content;
                        // Send thinking content in real-time
                        const payload = JSON.stringify({
                          token: "",
                          reasoning: content,
                        });
                        controller.enqueue(
                          encoder.encode(`data: ${payload}\n\n`),
                        );
                      } else {
                        // Regular content outside thinking tags
                        const payload = JSON.stringify({
                          token: content,
                          reasoning: "",
                        });
                        controller.enqueue(
                          encoder.encode(`data: ${payload}\n\n`),
                        );
                      }
                    }
                  } catch {
                    // Skip malformed JSON
                  }
                }
              }
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("Error processing Groq stream:", error);
            controller.error(error);
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
    } else {
      // Use OpenRouter for other models
      const openRouter = new OpenRouterAPI(requestBody.openRouterApiKey!);

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
      } // For thinking-capable models, always enable thinking
      const supportsThinking = modelSupportsThinking(selectedModel);
      const response = await openRouter.generateChatStream(
        messages,
        selectedModel,
        {
          searchEnabled: requestBody.searchEnabled,
          files: requestBody.files,
          thinkingEnabled: supportsThinking
            ? true
            : requestBody.thinkingEnabled,
          thinkingBudget: requestBody.thinkingBudget,
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
    } // Close else block
  } catch (err) {
    console.error("API error:", err);

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
