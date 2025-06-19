/*
  Warnings:

  - You are about to drop the column `accessCount` on the `shared_chats` table. All the data in the column will be lost.
  - You are about to drop the column `creatorId` on the `shared_chats` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `shared_chats` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `shared_chats` table. All the data in the column will be lost.
  - You are about to drop the column `maxAccess` on the `shared_chats` table. All the data in the column will be lost.
  - You are about to drop the column `originalChatId` on the `shared_chats` table. All the data in the column will be lost.
  - You are about to drop the column `shareToken` on the `shared_chats` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `shared_chats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `shared_chats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chatId` to the `shared_chats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `shared_chats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `shared_chats` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "shared_chats" DROP CONSTRAINT "shared_chats_originalChatId_fkey";

-- DropIndex
DROP INDEX "shared_chats_shareToken_key";

-- AlterTable
ALTER TABLE "shared_chats" DROP COLUMN "accessCount",
DROP COLUMN "creatorId",
DROP COLUMN "expiresAt",
DROP COLUMN "isActive",
DROP COLUMN "maxAccess",
DROP COLUMN "originalChatId",
DROP COLUMN "shareToken",
DROP COLUMN "title",
ADD COLUMN     "chatId" TEXT NOT NULL,
ADD COLUMN     "token" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "shared_chats_token_key" ON "shared_chats"("token");

-- CreateIndex
CREATE INDEX "shared_chats_chatId_idx" ON "shared_chats"("chatId");

-- AddForeignKey
ALTER TABLE "shared_chats" ADD CONSTRAINT "shared_chats_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
