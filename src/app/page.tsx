"use client";

import { Chatbox } from "~/components/chatbox";
import MessageList from "~/components/message-list";
import WelcomeScreen from "~/components/welcome-screen";
import TopRightIconHolder from "~/components/top-right-icon-holder";
import { useChat } from "~/contexts/ChatContext";

export default function Page() {
  const { messages, sendMessage } = useChat();

  return (
    <div className="relative flex h-full flex-col">
      <TopRightIconHolder />
      {messages.length === 0 ? (
        <WelcomeScreen onPromptSelect={sendMessage} />
      ) : (
        <MessageList messages={messages} />
      )}
      <Chatbox onSend={sendMessage} />
    </div>
  );
}
