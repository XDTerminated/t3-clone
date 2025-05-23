import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

type ChatRequest = {
  message?: string;
  history?: Array<{ sender: string; text: string }>;
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function POST(request: Request) {
  let promptContents: string[];
  try {
    const body = (await request.json()) as ChatRequest;

    if (Array.isArray(body.history)) {
      promptContents = body.history
        .filter((msg) => typeof msg.text === "string")
        .map((msg) => `${msg.sender}: ${msg.text.trim()}`);
      if (promptContents.length === 0) {
        return NextResponse.json({ reply: "" });
      }
    } else if (body.message && typeof body.message === "string") {
      const msg = body.message.trim();
      if (!msg) {
        return NextResponse.json({ reply: "" });
      }
      promptContents = [msg];
    } else {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing API key" },
      { status: 500 },
    );
  }

  try {
    const systemInstruction =
      "You are Gemini, a powerful conversational AI. Use the preceding conversation history to provide clear, accurate, and detailed answers. Respond naturally without adding any role prefixes or labels, and only output the answer text. Follow the tone of the user.";
    const fullContents = [systemInstruction, ...promptContents];

    const streamIterator = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-preview-05-20",
      contents: fullContents,
      config: {
        tools: [{ codeExecution: {} }],
      },
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
