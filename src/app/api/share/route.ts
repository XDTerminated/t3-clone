import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

// Generate a random token without external dependencies
function generateShareToken(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = (await req.json()) as { chatId: string };

  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
      userId: userId,
    },
  });

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const sharedChat = await prisma.sharedChat.create({
      data: {
        chatId: chatId,
        token: generateShareToken(),
        userId: userId,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    return NextResponse.json({ token: sharedChat.token });
  } catch (error) {
    console.error("Failed to create shared chat:", error);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 },
    );
  }
}
