"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Chatbox } from "~/components/chatbox";
import MessageList from "~/components/message-list";
import WelcomeScreen from "~/components/welcome-screen";
import TopRightIconHolder from "~/components/top-right-icon-holder";
import { LoginDialog } from "~/components/dialogs";
import { useChat } from "~/contexts/ChatContext";

function HomePage() {
  const searchParams = useSearchParams();
  const {
    messages,
    sendMessage,
    isLoadingChat,
    currentChatId,
    isPendingNewChat,
    loginDialogOpen,
    loginDialogAction,
    setLoginDialogOpen,
    selectChat,
    fetchChats,
  } = useChat(); // Handle chatId from URL (for shared chats)
  useEffect(() => {
    const chatId = searchParams.get("chatId");
    console.log(
      "Page useEffect - chatId from URL:",
      chatId,
      "currentChatId:",
      currentChatId,
    );
    if (chatId && chatId !== currentChatId) {
      console.log("Selecting chat:", chatId);
      // First refresh the chat list to ensure the imported chat is available
      void fetchChats().then(() => {
        void selectChat(chatId);
      });
    }
  }, [searchParams, currentChatId, selectChat, fetchChats]);

  // Show welcome screen only if:
  // 1. Not loading a chat AND
  // 2. No messages AND
  // 3. (No current chat OR in pending new chat state)
  const shouldShowWelcome =
    !isLoadingChat &&
    messages.length === 0 &&
    (currentChatId === null || isPendingNewChat === true);
  return (
    <div className="relative flex h-full flex-col">
      <TopRightIconHolder />
      {isLoadingChat ? (
        // Show blank area while loading
        <div className="flex-1" />
      ) : shouldShowWelcome ? (
        <WelcomeScreen onPromptSelect={(message) => sendMessage({ message })} />
      ) : (
        <div className="flex-1">
          <MessageList messages={messages} />
        </div>
      )}
      <Chatbox onSend={sendMessage} />
      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        action={loginDialogAction ?? "send"}
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  );
}
