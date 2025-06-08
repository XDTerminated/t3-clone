"use client";

import { Chatbox } from "~/components/chatbox";
import MessageList, { type Message } from "~/components/message-list";
import WelcomeScreen from "~/components/welcome-screen";
import { useState } from "react";

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const handleSend = async (message: string) => {
    // Build new chat history including this user message
    const newUserMsg: Message = { sender: "User", text: message };
    const history = [...messages, newUserMsg];
    setMessages(history);

    // Send full history to API for context
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history }),
    });

    if (!res.ok) {
      console.error(`HTTP error ${res.status}`);
      return;
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream")) {
      // Stream tokens as SSE with typewriter animation
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let aiText = "";
      let charQueueIndex = 0;
      const charDelay = 1; // faster ms delay per character
      // Initialize empty AI message
      setMessages((prev) => [...prev, { sender: "AI", text: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const dataStr = part.replace(/^data: /, "").trim();
          if (dataStr === "[DONE]") {
            break;
          }
          try {
            const { token } = JSON.parse(dataStr) as { token?: unknown };
            if (typeof token === "string") {
              for (const ch of token) {
                setTimeout(() => {
                  aiText += ch;
                  setMessages((prev) => {
                    const msgs = [...prev];
                    msgs[msgs.length - 1] = { sender: "AI", text: aiText };
                    return msgs;
                  });
                }, charQueueIndex * charDelay);
                charQueueIndex++;
              }
            }
          } catch {}
        }
      }
      return;
    }
    // Fallback to JSON if not streaming
    interface ChatResponse {
      reply?: string;
      error?: string;
    }
    let reply = "";
    try {
      const data = (await res.json()) as ChatResponse;
      if (data.error) {
        console.error(`API error: ${data.error}`);
        reply = `Error: ${data.error}`;
      } else if (data.reply) {
        reply = data.reply;
      }
    } catch (err) {
      console.error("Failed to parse JSON", err);
    }
    setMessages((prev) => [...prev, { sender: "AI", text: reply }]);
  };  return (
    <div className="relative flex h-full flex-col">
      {messages.length === 0 ? (
        <WelcomeScreen onPromptSelect={handleSend} />
      ) : (
        <MessageList messages={messages} />
      )}
      <Chatbox onSend={handleSend} />
    </div>
  );
}
