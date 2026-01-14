import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "~/lib/prisma";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const includeMessages = searchParams.get("include") === "messages";

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }
    // Verify chat ownership
    const chat = await prisma.chat.findFirst({ where: { id: chatId, userId } });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Fetch branches with optional messages include (single query instead of N+1)
    const branches = await prisma.branch.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      include: includeMessages
        ? {
            messages: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                content: true,
                role: true,
                files: true,
                reasoning: true,
                createdAt: true,
                branchId: true,
              },
            },
          }
        : undefined,
    });
    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
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
      name: string;
      parentBranchId?: string;
    };
    const { chatId, name, parentBranchId } = body;

    if (!chatId || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({ where: { id: chatId, userId } });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Create new branch
    const branch = await prisma.branch.create({
      data: {
        chatId,
        name,
      },
    });

    // If parentBranchId provided, copy messages from parent branch using batch insert
    if (parentBranchId) {
      const parentMessages = await prisma.message.findMany({
        where: { chatId, branchId: parentBranchId },
        orderBy: { createdAt: "asc" },
      });

      // Batch create all messages at once (instead of N+1 individual inserts)
      if (parentMessages.length > 0) {
        await prisma.message.createMany({
          data: parentMessages.map((message) => ({
            content: message.content,
            role: message.role,
            chatId: message.chatId,
            branchId: branch.id,
            files: message.files ?? undefined,
            reasoning: message.reasoning ?? undefined,
          })),
        });
      }
    }

    return NextResponse.json({ branch });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
