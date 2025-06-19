import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, withRetry } from "~/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chats = await withRetry(async () => {
      return await prisma.chat.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        // Remove messages include for faster initial load
        select: {
          id: true,
          title: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          pinned: true,
        },
      });
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const chat = await withRetry(async () => {
      return await prisma.chat.create({
        data: {
          userId,
          title: null, // Will be generated later
        },
      });
    }); // Ensure default branch exists, but don't block chat creation
    try {
      await withRetry(async () => {
        return await prisma.branch.create({
          data: {
            chatId: chat.id,
            name: "Main",
          },
        });
      });
    } catch (branchError: unknown) {
      console.error("Error creating default branch:", branchError);
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
