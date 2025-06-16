/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const MODEL_NAME = "gemini-1.5-flash"; // Faster model for quick title generation

export async function POST(request: Request) {
  let requestBody: unknown;
  try {
    requestBody = (await request.json()) as unknown;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = requestBody as { message?: unknown };
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 },
      );
    }

    // Truncate very long messages for faster processing
    const truncatedMessage =
      message.length > 200 ? message.substring(0, 200) + "..." : message;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set.");
      return NextResponse.json(
        { error: "AI configuration error" },
        { status: 500 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const generationConfig = {
      temperature: 0.3, // Lower temperature for faster, more consistent results
      topK: 10, // Increased for faster token selection
      topP: 0.8, // Reduced for faster processing
      maxOutputTokens: 15, // Shorter for faster generation
    };

    // Simplified safety settings for faster processing
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ];

    // Improved prompt for single, clean title generation
    const prompt = `Generate exactly one short title (3-5 words) for this message. Return only the title, nothing else: "${truncatedMessage}"`;

    const parts = [{ text: prompt }];

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,
    });
    let generatedTitle = "New Chat"; // Default title
    if (result.response?.candidates && result.response.candidates.length > 0) {
      const candidate = result.response.candidates[0];
      if (candidate?.content?.parts && candidate.content.parts.length > 0) {
        // Ensure part.text is defined before trying to access it
        const textPart = candidate.content.parts[0]?.text;
        if (textPart) {
          // Clean and process the generated text
          let cleanedTitle = textPart.trim();

          // Remove quotes and common unwanted characters
          cleanedTitle = cleanedTitle.replace(/["""''`]/g, "");

          // Split by common separators and take only the first valid title
          const separators = /[\n\r\t|;:•\-]+/;
          const titleOptions = cleanedTitle.split(separators);

          // Find the first non-empty, reasonable length title
          for (const option of titleOptions) {
            const cleaned = option.trim();
            const reservedWordsRegex = /^(title|chat|conversation)$/i;
            if (
              cleaned.length >= 3 &&
              cleaned.length <= 50 &&
              !reservedWordsRegex.exec(cleaned)
            ) {
              generatedTitle = cleaned;
              break;
            }
          }
          // If no good option found, use the first part of the original text
          if (generatedTitle === "New Chat" && titleOptions.length > 0) {
            const firstOption = titleOptions[0]?.trim();
            if (firstOption && firstOption.length >= 3) {
              generatedTitle = firstOption;
            }
          }
        }
      }
    }

    // Fallback if title is empty or too short after generation
    if (!generatedTitle || generatedTitle.length < 3) {
      console.warn(
        "Generated title was empty or too short, using a local fallback.",
      );
      if (typeof message === "string") {
        generatedTitle =
          message.trim().split(/\s+/).slice(0, 5).join(" ") +
          (message.trim().split(/\s+/).length > 5 ? "..." : "");
      }
      if (!generatedTitle) {
        generatedTitle = "New Chat";
      }
    }

    return NextResponse.json({ title: generatedTitle });
  } catch (error: unknown) {
    console.error("Error generating title with Gemini:", error);
    const messageFromBody = (requestBody as { message?: unknown })?.message;
    let fallbackTitle =
      typeof messageFromBody === "string"
        ? messageFromBody.trim().split(/\s+/).slice(0, 5).join(" ")
        : "Chat";
    if (
      typeof messageFromBody === "string" &&
      messageFromBody.trim().split(/\s+/).length > 5
    ) {
      fallbackTitle += "...";
    }
    if (!fallbackTitle) {
      fallbackTitle = "New Chat";
    }
    return NextResponse.json(
      {
        title: fallbackTitle,
        errorDetail: "AI title generation failed, used fallback.",
      },
      { status: 500 },
    );
  }
}
