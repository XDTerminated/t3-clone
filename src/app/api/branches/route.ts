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
    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }
    // Verify chat ownership
    const chat = await prisma.chat.findFirst({ where: { id: chatId, userId } });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    const branches = await prisma.branch.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
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

    // If parentBranchId provided, copy messages from parent branch
    if (parentBranchId) {
      const parentMessages = await prisma.message.findMany({
        where: { chatId, branchId: parentBranchId },
        orderBy: { createdAt: "asc" },
      });

      // Copy messages to new branch
      for (const message of parentMessages) {
        await prisma.message.create({
          data: {
            content: message.content,
            role: message.role,
            chatId: message.chatId,
            branchId: branch.id,
          },
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
