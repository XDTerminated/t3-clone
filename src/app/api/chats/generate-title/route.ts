import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "~/lib/prisma";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { chatId: string; message: string };
    const { chatId, message } = body;

    if (!chatId || !message) {
      return NextResponse.json(
        { error: "Missing chatId or message" },
        { status: 400 },
      );
    }

    // Verify the chat belongs to the user
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
    });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    } // Generate a title using Gemini
    const titlePrompt = `Generate a short, descriptive title (max 50 characters) for a chat conversation that starts with this message: "${message}". Only return the title, nothing else.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ parts: [{ text: titlePrompt }] }],
    });

    // Extract title from the response
    let title = "New Chat";
    if (result && typeof result.text === "string") {
      title = result.text.trim();
    }

    // Update the chat with the generated title
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { title },
    });

    return NextResponse.json({ title: updatedChat.title });
  } catch (error) {
    console.error("Error generating title:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
