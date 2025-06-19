/*
  Warnings:

  - You are about to drop the `background_tasks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "background_tasks";

-- CreateTable
CREATE TABLE "shared_chats" (
    "id" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "originalChatId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "maxAccess" INTEGER,

    CONSTRAINT "shared_chats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shared_chats_shareToken_key" ON "shared_chats"("shareToken");
