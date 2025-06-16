/*
  Warnings:

  - You are about to drop the column `wasRegenerated` on the `messages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "messages" DROP COLUMN "wasRegenerated";
