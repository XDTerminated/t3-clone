import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "~/lib/prisma";

interface UpdateChatBody {
  title?: string;
  pinned?: boolean;
}

export async function DELETE(
  request: Request,
  { params }: { params: { chatId: string } },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = params;

    // Verify the chat belongs to the user and delete it
    const deletedChat = await prisma.chat.deleteMany({
      where: {
        id: chatId,
        userId: userId,
      },
    });

    if (deletedChat.count === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { chatId: string } },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { chatId } = params;
    const body = (await request.json()) as UpdateChatBody;

    // Verify the chat belongs to the user
    const existingChat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: userId,
      },
    });

    if (!existingChat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Update the chat with provided fields
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.pinned !== undefined && { pinned: body.pinned }),
      },
    });

    return NextResponse.json({ chat: updatedChat });
  } catch (error) {
    console.error("Error updating chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
