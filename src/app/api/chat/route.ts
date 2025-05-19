import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

type ChatRequest = { message: string };
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function POST(request: Request) {
  let message: string;
  // Parse and validate request body
  try {
    const body = (await request.json()) as Partial<ChatRequest>;
    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    message = body.message.trim();
    if (!message) {
      return NextResponse.json({ reply: "" });
    }
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  // Ensure API key is configured
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing API key" },
      { status: 500 },
    );
  }

  // Streamed response using GenAI SDK
  try {
    // Await the async generator stream
    const streamIterator = await ai.models.generateContentStream({
      model: "gemini-2.0-flash-001",
      contents: message,
    });
    const encoder = new TextEncoder();
    const responseStream = new ReadableStream({
      async start(controller) {
        for await (const part of streamIterator) {
          const token = typeof part.text === "string" ? part.text : "";
          const payload = JSON.stringify({ token });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        }
        controller.close();
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
    console.error("Gemini SDK error:", err);
    return NextResponse.json(
      { error: "Network or server error" },
      { status: 502 },
    );
  }
}
