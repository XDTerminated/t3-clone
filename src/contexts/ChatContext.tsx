"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@clerk/nextjs";

// Types
interface Chat {
  id: string;
  title: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  messages: Array<{ sender: string; text: string }>;
  loading: boolean;
  createNewChat: () => Promise<string | null>;
  startNewChat: () => void;
  selectChat: (chatId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  fetchChats: () => Promise<void>;
}

// API Response Types
interface ChatsResponse {
  chats: Chat[];
}

interface CreateChatResponse {
  chat: Chat;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Array<{ sender: string; text: string }>
  >([]);
  const [loading] = useState(false);
  const [isPendingNewChat, setIsPendingNewChat] = useState(false);
  const { isSignedIn } = useAuth();

  const fetchChats = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = (await response.json()) as ChatsResponse;
        setChats(data.chats);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  }, [isSignedIn]);
  const startNewChat = () => {
    // Start a new chat session without creating it in the database
    setCurrentChatId(null);
    setMessages([]);
    setIsPendingNewChat(true);
  };

  const createNewChat = async (): Promise<string | null> => {
    if (!isSignedIn) return null;

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
      });

      if (response.ok) {
        const data = (await response.json()) as CreateChatResponse;
        const newChat = data.chat;
        setChats((prev) => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
        setMessages([]);
        setIsPendingNewChat(false);
        return newChat.id;
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
    return null;
  };  const selectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    setMessages([]);
    setIsPendingNewChat(false); // Clear pending new chat state when selecting an existing chat

    // Load messages for the selected chat
    try {
      const response = await fetch(`/api/messages?chatId=${chatId}`);
      if (response.ok) {
        const data = (await response.json()) as {
          messages: Array<{ role: string; content: string }>;
        };
        // Convert database messages to UI format
        const uiMessages = data.messages.map((msg) => ({
          sender: msg.role === "user" ? "User" : "AI",
          text: msg.content,
        }));
        setMessages(uiMessages);
      } else {
        console.error("Failed to load messages for chat:", chatId);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };
  const saveMessage = async (
    chatId: string,
    content: string,
    role: "user" | "assistant",
  ) => {
    try {
      console.log("Saving message:", {
        chatId,
        content: content.substring(0, 50) + "...",
        role,
      });
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, content, role }),
      });

      if (!response.ok) {
        console.error(
          "Failed to save message:",
          response.status,
          response.statusText,
        );
        const errorText = await response.text();
        console.error("Error details:", errorText);
      } else {
        console.log("Message saved successfully");
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };
  const generateTitle = async (chatId: string, message: string) => {
    try {
      console.log(
        "Generating title for chat:",
        chatId,
        "with message:",
        message.substring(0, 50) + "...",
      );
      const response = await fetch("/api/chats/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message }),
      });

      if (!response.ok) {
        console.error(
          "Failed to generate title:",
          response.status,
          response.statusText,
        );
        const errorText = await response.text();
        console.error("Title generation error details:", errorText);
      } else {
        console.log("Title generated successfully");
        // Refresh chats to get the updated title
        void fetchChats();
      }
    } catch (error) {
      console.error("Error generating title:", error);
    }
  };  const sendMessage = async (message: string) => {
    let chatId = currentChatId;
    let isNewChat = false;

    if (!chatId || isPendingNewChat) {
      // Create new chat if none exists or if we're in a pending new chat state
      const newChatId = await createNewChat();
      if (!newChatId) return;
      chatId = newChatId;
      setCurrentChatId(newChatId);
      setIsPendingNewChat(false);
      isNewChat = true;
    }

    // Add user message to UI immediately
    const newUserMsg = { sender: "User", text: message };
    setMessages((prev) => [...prev, newUserMsg]);

    // Save user message to database
    await saveMessage(chatId, message, "user");

    // Generate title if this is the first message (new chat or empty messages)
    if (isNewChat || messages.length === 0) {
      void generateTitle(chatId, message);
    }

    // Get AI response
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, chatId }),
      });

      if (!response.ok) {
        console.error(`HTTP error ${response.status}`);
        return;
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream")) {        // Handle streaming response
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let completeAiText = ""; // This will store the complete response
        let displayedLength = 0; // Track how many characters we've displayed
        const charDelay = 1;

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
            if (dataStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(dataStr) as { token?: unknown };
              const { token } = parsed;
              if (typeof token === "string") {
                // Add to complete response immediately
                completeAiText += token;                // Schedule character-by-character display for new characters only
                const newChars = completeAiText.slice(displayedLength);
                for (let i = 0; i < newChars.length; i++) {
                  const targetLength = displayedLength + i + 1;
                  setTimeout(() => {
                    setMessages((prev) => {
                      const msgs = [...prev];
                      if (msgs[msgs.length - 1]?.sender === "AI") {
                        // Set the text to the exact substring we want
                        msgs[msgs.length - 1] = {
                          ...msgs[msgs.length - 1]!,
                          text: completeAiText.slice(0, targetLength)
                        };
                      }
                      return msgs;
                    });
                  }, (displayedLength + i) * charDelay);
                }
                displayedLength = completeAiText.length;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }

        // Save complete AI response to database
        if (completeAiText) {
          await saveMessage(chatId, completeAiText, "assistant");
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Fetch chats when user signs in
  useEffect(() => {
    if (isSignedIn) {
      void fetchChats();
    }
  }, [isSignedIn, fetchChats]);

  return (
    <ChatContext.Provider      value={{
        chats,
        currentChatId,
        messages,
        loading,
        createNewChat,
        startNewChat,
        selectChat,
        sendMessage,
        fetchChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
