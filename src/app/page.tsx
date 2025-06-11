"use client";

import { Chatbox } from "~/components/chatbox";
import MessageList from "~/components/message-list";
import WelcomeScreen from "~/components/welcome-screen";
import TopRightIconHolder from "~/components/top-right-icon-holder";
import { LoginDialog } from "~/components/login-dialog";
import { useChat } from "~/contexts/ChatContext";

export default function Page() {
  const {
    messages,
    sendMessage,
    isLoadingChat,
    currentChatId,
    isPendingNewChat,
    loginDialogOpen,
    loginDialogAction,
    setLoginDialogOpen,
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
