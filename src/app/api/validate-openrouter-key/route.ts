import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { apiKey } = (await request.json()) as { apiKey: string };

    if (!apiKey?.startsWith("sk-or-v1-")) {
      return NextResponse.json(
        { error: "Invalid API key format" },
        { status: 400 },
      );
    }

    // Test the API key with a simple request to OpenRouter
    const testResponse = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "T3 Clone Chat App",
      },
    });

    if (testResponse.ok) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
  } catch (error) {
    console.error("API key validation error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
