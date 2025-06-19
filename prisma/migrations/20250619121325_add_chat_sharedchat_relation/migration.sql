-- AddForeignKey
ALTER TABLE "shared_chats" ADD CONSTRAINT "shared_chats_originalChatId_fkey" FOREIGN KEY ("originalChatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
