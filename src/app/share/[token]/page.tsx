import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "~/lib/prisma";
import type { JsonValue } from "@prisma/client/runtime/library";

type SharePageProps = {
  params: Promise<{
    token: string;
  }>;
};

type SharedChatWithDetails = {
  id: string;
  token: string;
  chatId: string;
  userId: string;
  createdAt: Date;
  chat: {
    id: string;
    title: string | null;
    userId: string;
    pinned: boolean;
    createdAt: Date;
    updatedAt: Date;
    messages: Array<{
      id: string;
      content: string;
      role: string;
      chatId: string;
      branchId: string | null;
      files: JsonValue;
      reasoning: string | null;
      createdAt: Date;
    }>;
    branches: Array<{
      id: string;
      name: string | null;
      chatId: string;
      createdAt: Date;
    }>;
  };
};

export default async function SharePage({ params }: SharePageProps) {
  const { userId } = await auth();
  const { token } = await params;

  if (!userId) {
    return redirect("/sign-in");
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const sharedChat = (await prisma.sharedChat.findUnique({
    where: {
      token: token,
    },
    include: {
      chat: {
        include: {
          messages: true,
          branches: true,
        },
      },
    },
  })) as SharedChatWithDetails | null;

  if (!sharedChat) {
    return <div>Chat not found or sharing link is invalid.</div>;
  }

  // Prevent user from importing their own chat
  if (sharedChat.chat.userId === userId) {
    return redirect(`/?chatId=${sharedChat.chat.id}`);
  }

  const newChat = await prisma.chat.create({
    data: {
      userId: userId,
      title: sharedChat.chat.title,
    },
  });

  // Create a mapping from old branch IDs to new branch IDs
  const branchIdMapping: Record<string, string> = {};

  // Recreate all branches from the original chat
  for (const originalBranch of sharedChat.chat.branches) {
    const newBranch = await prisma.branch.create({
      data: {
        chatId: newChat.id,
        name: originalBranch.name ?? "main",
      },
    });
    branchIdMapping[originalBranch.id] = newBranch.id;
  }

  // If there are no branches, create a default one
  if (sharedChat.chat.branches.length === 0) {
    const defaultBranch = await prisma.branch.create({
      data: {
        chatId: newChat.id,
        name: "main",
      },
    });
    branchIdMapping.default = defaultBranch.id;
  } // Import messages with correct branch assignments
  const messagesToCreate = sharedChat.chat.messages
    .map((message) => {
      const targetBranchId = message.branchId
        ? (branchIdMapping[message.branchId] ??
          branchIdMapping.default ??
          Object.values(branchIdMapping)[0])
        : (branchIdMapping.default ?? Object.values(branchIdMapping)[0]);

      if (!targetBranchId) return null;

      return {
        content: message.content,
        role: message.role,
        chatId: newChat.id,
        branchId: targetBranchId,
        files: message.files, // Keep original JsonValue type
        reasoning: message.reasoning,
      };
    })
    .filter((msg): msg is NonNullable<typeof msg> => msg !== null);
  if (messagesToCreate.length > 0) {
    await prisma.message.createMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: messagesToCreate as any[], // Type assertion to bypass Prisma JsonValue incompatibility
    });
  }

  return redirect(`/?chatId=${newChat.id}`);
}
