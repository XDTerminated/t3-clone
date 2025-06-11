"use client";

import { Chatbox } from "~/components/chatbox";
import MessageList from "~/components/message-list";
import WelcomeScreen from "~/components/welcome-screen";
import TopRightIconHolder from "~/components/top-right-icon-holder";
import { useChat } from "~/contexts/ChatContext";

export default function Page() {
  const {
    messages,
    sendMessage,
    isLoadingChat,
    currentChatId,
    isPendingNewChat,
  } = useChat();

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
        <WelcomeScreen onPromptSelect={sendMessage} />
      ) : (
        <div className="animate-in fade-in-50 zoom-in-95 flex-1 duration-100">
          <MessageList messages={messages} />
        </div>
      )}
      <Chatbox onSend={sendMessage} />
    </div>
  );
}
