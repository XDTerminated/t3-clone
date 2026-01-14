import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";
import type { UploadFileResponse } from "../types";
import type { MessageContent, ChatStreamOptions, ChatMessage } from "./types";
import { mapToGeminiModelName } from "./model-helpers";

export class GeminiAPI {
  private genAI: GoogleGenAI;
  private legacyGenAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.legacyGenAI = new GoogleGenerativeAI(apiKey);
  }

  async generateChatStream(
    messages: ChatMessage[],
    modelId: string,
    options?: ChatStreamOptions,
  ) {
    let processedMessages = [...messages];

    if (options?.files && options.files.length > 0) {
      processedMessages = await this.processFilesIntoMessages(
        processedMessages,
        options.files,
      );
    }

    if (options?.searchEnabled) {
      return this.generateWithSearch(processedMessages, modelId, options);
    } else {
      return this.generateWithoutSearch(processedMessages, modelId, options);
    }
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

  private async processFilesIntoMessages(
    messages: ChatMessage[],
    files: UploadFileResponse[],
  ): Promise<ChatMessage[]> {
    const processedMessages = [...messages];

    const imageFiles = files.filter((file) => {
      const fileType = (file.serverData as { type: string })?.type ?? "";
      return fileType.startsWith("image/");
    });

    const documentFiles = files.filter((file) => {
      const fileType = (file.serverData as { type: string })?.type ?? "";
      return fileType === "application/pdf" || fileType.startsWith("text/");
    });

    if (imageFiles.length > 0) {
      const lastUserMessageIndex = processedMessages
        .map((m) => m.role)
        .lastIndexOf("user");
      if (lastUserMessageIndex !== -1) {
        const lastUserMessage = processedMessages[lastUserMessageIndex];
        if (lastUserMessage) {
          const messageContent: MessageContent[] = [];

          if (typeof lastUserMessage.content === "string") {
            messageContent.push({ type: "text", text: lastUserMessage.content });
          } else {
            messageContent.push(...lastUserMessage.content);
          }

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
    }

    if (documentFiles.length > 0) {
      const lastUserMessageIndex = processedMessages
        .map((m) => m.role)
        .lastIndexOf("user");
      if (lastUserMessageIndex !== -1) {
        const lastUserMessage = processedMessages[lastUserMessageIndex];
        if (lastUserMessage) {
          const messageContent: MessageContent[] = [];

          if (typeof lastUserMessage.content === "string") {
            messageContent.push({ type: "text", text: lastUserMessage.content });
          } else {
            messageContent.push(...lastUserMessage.content);
          }

          for (const file of documentFiles) {
            try {
              const fileType = (file.serverData as { type: string })?.type ?? "";
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
    messages: ChatMessage[],
    modelId: string,
    options?: ChatStreamOptions,
  ): Promise<Response> {
    try {
      const contents = await this.convertMessagesForNewSDK(messages, options);

      const systemMessage = messages.find((m) => m.role === "system");
      const systemInstruction = systemMessage
        ? typeof systemMessage.content === "string"
          ? systemMessage.content
          : (systemMessage.content[0]?.text ?? "")
        : "";

      const groundingTool = { googleSearch: {} };

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

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const supportsThinking = this.modelSupportsThinking(modelId);
      if (supportsThinking) {
        config.thinkingConfig = { includeThoughts: true };
        if (options?.thinkingBudget !== undefined) {
          config.thinkingConfig.thinkingBudget = options.thinkingBudget;
        }
      }

      const response = await this.genAI.models.generateContent({
        model: mapToGeminiModelName(modelId),
        contents,
        config,
      });

      console.log("Gemini API response:", JSON.stringify(response, null, 2));
      return this.createStreamFromNewSDKResponse(response);
    } catch (error) {
      console.error("Search-enabled generation failed:", error);
      return this.generateWithoutSearch(messages, modelId);
    }
  }

  private async generateWithoutSearch(
    messages: ChatMessage[],
    modelId: string,
    options?: ChatStreamOptions,
  ) {
    const supportsThinking = this.modelSupportsThinking(modelId);
    const shouldUseThinking = supportsThinking;

    if (shouldUseThinking) {
      const thinkingOptions = { ...options, thinkingEnabled: true };
      return this.generateWithThinking(messages, modelId, thinkingOptions);
    } else {
      return this.generateWithLegacySDK(messages, modelId);
    }
  }

  private async generateWithThinking(
    messages: ChatMessage[],
    modelId: string,
    options?: ChatStreamOptions,
  ): Promise<Response> {
    try {
      const contents = await this.convertMessagesForNewSDK(messages, options);

      const systemMessage = messages.find((m) => m.role === "system");
      const systemInstruction = systemMessage
        ? typeof systemMessage.content === "string"
          ? systemMessage.content
          : (systemMessage.content[0]?.text ?? "")
        : "";

      const config: {
        systemInstruction?: string;
        thinkingConfig?: {
          thinkingBudget?: number;
          includeThoughts?: boolean;
        };
      } = {};

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      config.thinkingConfig = { includeThoughts: true };

      if (options?.thinkingBudget !== undefined) {
        config.thinkingConfig.thinkingBudget = options.thinkingBudget;
      }

      const response = await this.genAI.models.generateContent({
        model: mapToGeminiModelName(modelId),
        contents,
        config,
      });

      return this.createStreamFromNewSDKResponse(response);
    } catch (error) {
      console.error("Thinking-enabled generation failed:", error);
      return this.generateWithLegacySDK(messages, modelId);
    }
  }

  private async generateWithLegacySDK(
    messages: ChatMessage[],
    modelId: string,
  ) {
    const { contents, systemInstruction } = this.convertToGeminiFormat(messages);

    const modelConfig = {
      model: mapToGeminiModelName(modelId),
      systemInstruction: systemInstruction,
    };

    const model = this.legacyGenAI.getGenerativeModel(modelConfig);
    const result = await model.generateContentStream({ contents });
    return this.createCompatibleStream(result);
  }

  private convertToGeminiFormat(messages: ChatMessage[]) {
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
    messages: ChatMessage[],
    _options?: ChatStreamOptions,
  ) {
    const contents = [];

    for (const message of messages) {
      if (message.role === "system") {
        continue;
      }

      const parts: Array<{
        text?: string;
        inlineData?: { mimeType: string; data: string };
      }> = [];

      if (typeof message.content === "string") {
        parts.push({ text: message.content });
      } else {
        for (const content of message.content) {
          if (content.type === "text" && content.text) {
            parts.push({ text: content.text });
          } else if (content.type === "image_url" && content.image_url?.url) {
            try {
              let base64Data: string;
              let mimeType: string;

              if (content.image_url.url.startsWith("data:")) {
                const [mimeTypePart, data] = content.image_url.url.split(",");
                mimeType = mimeTypePart!
                  .replace("data:", "")
                  .replace(";base64", "");
                base64Data = data!;
              } else {
                const response = await fetch(content.image_url.url);
                const buffer = await response.arrayBuffer();
                base64Data = Buffer.from(buffer).toString("base64");

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

              parts.push({ inlineData: { mimeType, data: base64Data } });
            } catch (error) {
              console.error("Failed to process image:", error);
              parts.push({ text: `[Image could not be processed]` });
            }
          } else if (content.type === "file" && content.file) {
            try {
              if (content.file.file_data.startsWith("data:")) {
                const [mimeTypePart, base64Data] =
                  content.file.file_data.split(",");
                const mimeType = mimeTypePart!
                  .replace("data:", "")
                  .replace(";base64", "");

                parts.push({ inlineData: { mimeType, data: base64Data! } });
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
            const responseObj = response as {
              candidates?: Array<{
                content?: {
                  parts?: Array<{ text?: string; thought?: boolean }>;
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
            );

            if (groundingMetadata && text) {
              text = addCitations(text, groundingMetadata);
            }

            if (thoughtText) {
              const thoughtWords = thoughtText.split(" ");

              for (let i = 0; i < thoughtWords.length; i++) {
                const word = thoughtWords[i];
                if (word?.trim()) {
                  const payload = JSON.stringify({
                    token: "",
                    reasoning: word + (i < thoughtWords.length - 1 ? " " : ""),
                  });
                  controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                  await new Promise((resolve) => setTimeout(resolve, 20));
                }
              }

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
              const words = text.split(" ");
              const chunkSize = 3;

              for (let i = 0; i < words.length; i += chunkSize) {
                const chunk = words.slice(i, i + chunkSize).join(" ");
                if (chunk.trim()) {
                  const payload = JSON.stringify({
                    token: chunk + (i + chunkSize < words.length ? " " : ""),
                    reasoning: "",
                  });
                  controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
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

    function addCitations(
      text: string,
      groundingMetadata: {
        groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
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
                const payload = JSON.stringify({ token: text, reasoning: "" });
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
