import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, withRetry } from "~/lib/prisma";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const branchId = searchParams.get("branchId");
    // Pagination parameters
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "100", 10),
      500
    ); // Max 500 messages
    const cursor = searchParams.get("cursor"); // Message ID to start after

    if (!chatId) {
      return NextResponse.json(
        { error: "Missing chatId parameter" },
        { status: 400 },
      );
    }

    // Verify the chat belongs to the user
    const chat = await withRetry(async () => {
      return await prisma.chat.findFirst({
        where: { id: chatId, userId },
      });
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Build query with optional cursor-based pagination
    const whereClause = branchId ? { chatId, branchId } : { chatId };

    // Get messages for the chat with pagination
    const messages = await withRetry(async () => {
      return await prisma.message.findMany({
        where: whereClause,
        select: {
          id: true,
          content: true,
          role: true,
          files: true,
          reasoning: true,
          createdAt: true,
          branchId: true,
        },
        orderBy: { createdAt: "asc" },
        take: limit + 1, // Fetch one extra to check if there are more
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1, // Skip the cursor itself
            }
          : {}),
      });
    });

    // Check if there are more messages
    const hasMore = messages.length > limit;
    const returnMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? returnMessages[returnMessages.length - 1]?.id : null;

    return NextResponse.json({
      messages: returnMessages,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = (await request.json()) as {
      chatId: string;
      content: string;
      role: string;
      branchId?: string;
      files?: Array<{ name: string; type: string; data: string }>;
      reasoning?: string;
    };
    const { chatId, content, role, branchId, files, reasoning } = body;

    if (!chatId || !content || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (role !== "user" && role !== "assistant") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    } // Verify the chat belongs to the user
    const chat = await withRetry(async () => {
      return await prisma.chat.findFirst({
        where: { id: chatId, userId },
      });
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    } // Get or create the appropriate branch for this chat
    let branch;
    if (branchId) {
      // Use the provided branchId
      branch = await withRetry(async () => {
        return await prisma.branch.findFirst({
          where: { id: branchId, chatId },
        });
      });
      if (!branch) {
        return NextResponse.json(
          { error: "Branch not found" },
          { status: 404 },
        );
      }
    } else {
      // Get or create the 'Main' branch for this chat (fallback for old behavior)
      branch = await withRetry(async () => {
        return await prisma.branch.findFirst({
          where: { chatId, name: "Main" },
        });
      });
      branch ??= await withRetry(async () => {
        return await prisma.branch.create({ data: { chatId, name: "Main" } });
      });
    } // Create the message, associating it with the branch
    const message = await withRetry(async () => {
      return await prisma.message.create({
        data: {
          chatId,
          content,
          role,
          branchId: branch.id,
          files: files ?? undefined,
          reasoning: reasoning ?? undefined,
        },
      });
    });

    // Update the chat's updatedAt timestamp
    await withRetry(async () => {
      return await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
