"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@clerk/nextjs";
// Using built-in crypto for UUIDs

// Types
interface Chat {
  id: string;
  title: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
}

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  messages: Array<{ sender: string; text: string }>;
  loading: boolean;
  isLoadingChat: boolean;
  isPendingNewChat: boolean;
  isLoadingChats: boolean; // Loading state for sidebar chats
  createNewChat: () => Promise<Chat | null>; // Changed return type
  startNewChat: () => void;
  selectChat: (chatId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  fetchChats: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, newTitle: string) => Promise<void>;
  pinChat: (chatId: string) => Promise<void>; // Login dialog state
  loginDialogOpen: boolean;
  loginDialogAction: "send" | "chat" | null;
  setLoginDialogOpen: (open: boolean) => void;
  setLoginDialogAction: (action: "send" | "chat" | null) => void;
  branches: {
    id: string;
    name: string;
    messages: Array<{ sender: string; text: string }>;
  }[];
  currentBranchId: string | null;
  selectBranch: (branchId: string) => void;
  regenerateResponse: (userMessageIndex: number) => Promise<void>;
  prevBranch: () => void;
  nextBranch: () => void;
  branchIndex: number;
  branchCount: number;
}

// API Response Types
interface ChatsResponse {
  chats: Chat[];
}

interface CreateChatResponse {
  chat: Chat;
}

interface GenerateTitleResponse {
  title: string;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Array<{ sender: string; text: string }>
  >([]);
  const [loading] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isPendingNewChat, setIsPendingNewChat] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false); // Loading state for sidebar
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginDialogAction, setLoginDialogAction] = useState<
    "send" | "chat" | null
  >(null);
  // Branching support
  const [branches, setBranches] = useState<
    {
      id: string;
      name: string;
      messages: Array<{ sender: string; text: string }>;
    }[]
  >([]);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
  const { isSignedIn, isLoaded } = useAuth();
  const fetchChats = useCallback(async () => {
    if (!isSignedIn) return;

    setIsLoadingChats(true);
    try {
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = (await response.json()) as ChatsResponse;
        setChats(data.chats);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  }, [isSignedIn]);
  const startNewChat = () => {
    // Check if user is signed in first
    if (!isSignedIn) {
      setLoginDialogAction("chat");
      setLoginDialogOpen(true);
      return;
    }

    // Don't do anything if we're already in a pending new chat state
    // OR if we're already on the welcome screen (no current chat and no messages)
    if (
      (isPendingNewChat && !currentChatId) ||
      (!currentChatId && messages.length === 0)
    ) {
      return;
    } // Start a new chat session without creating it in the database
    setIsLoadingChat(true);
    setCurrentChatId(null);
    setMessages([]);
    setIsPendingNewChat(true);

    // Clear branches and branch ID - they will be set when chat is created
    setBranches([]);
    setCurrentBranchId(null);

    // Add a small delay for smooth transition
    setTimeout(() => {
      setIsLoadingChat(false);
    }, 150);
  };
  const createNewChat = async (): Promise<Chat | null> => {
    // Changed return type
    if (!isSignedIn) return null;

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
      });

      if (response.ok) {
        const data = (await response.json()) as CreateChatResponse;
        // Don't update UI state here - let sendMessage handle it
        return data.chat; // Return the full chat object
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
    return null;
  };
  const selectChat = async (chatId: string) => {
    // Don't do anything if we're already on this chat
    if (currentChatId === chatId) {
      return;
    }

    setIsLoadingChat(true);
    setCurrentChatId(chatId);
    setMessages([]); // Clear messages immediately for smooth transition
    setIsPendingNewChat(false); // Clear pending new chat state when selecting an existing chat

    // Add a small delay to ensure smooth transition
    await new Promise((resolve) => setTimeout(resolve, 150)); // Load branches for the chat
    let firstBranchId: string | null = null;
    try {
      const branchRes = await fetch(`/api/branches?chatId=${chatId}`);
      if (branchRes.ok) {
        const data = (await branchRes.json()) as {
          branches: Array<{ id: string; name: string }>;
        };

        // Load messages for ALL branches to ensure persistence
        const branchesWithMessages = await Promise.all(
          data.branches.map(async (branch) => {
            try {
              const msgRes = await fetch(
                `/api/messages?chatId=${chatId}&branchId=${branch.id}`,
              );
              if (msgRes.ok) {
                const msgData = (await msgRes.json()) as {
                  messages: Array<{ role: string; content: string }>;
                };
                const uiMessages = msgData.messages.map((msg) => ({
                  sender: msg.role === "user" ? "User" : "AI",
                  text: msg.content,
                }));
                return { ...branch, messages: uiMessages };
              }
            } catch (err) {
              console.error(
                `Failed to load messages for branch ${branch.id}:`,
                err,
              );
            }
            return { ...branch, messages: [] };
          }),
        );

        setBranches(branchesWithMessages);

        if (branchesWithMessages.length > 0) {
          firstBranchId = branchesWithMessages[0]!.id;
          setCurrentBranchId(firstBranchId);
          // Set messages from the first branch
          setMessages(branchesWithMessages[0]!.messages);
        }
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
      // Fallback to loading messages without branches
      try {
        const response = await fetch(`/api/messages?chatId=${chatId}`);
        if (response.ok) {
          const msgData = (await response.json()) as {
            messages: Array<{ role: string; content: string }>;
          };
          const uiMessages = msgData.messages.map((msg) => ({
            sender: msg.role === "user" ? "User" : "AI",
            text: msg.content,
          }));
          setMessages(uiMessages);
        }
      } catch (fallbackErr) {
        console.error("Failed to load messages:", fallbackErr);
        setMessages([]);
      }
    }

    setIsLoadingChat(false);
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
      const requestBody: {
        chatId: string;
        content: string;
        role: string;
        branchId?: string;
      } = {
        chatId,
        content,
        role,
      };

      // Only include branchId if we have one
      if (currentBranchId) {
        requestBody.branchId = currentBranchId;
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
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

  const generateQuickTitle = (message: string): string => {
    // Generate a quick title from the first message for immediate UI feedback
    const words = message.trim().split(/\s+/).slice(0, 6);
    return words.join(" ") + (words.length >= 6 ? "..." : "");
  };
  const sendMessage = async (message: string) => {
    // Check if user is signed in first
    if (!isSignedIn) {
      setLoginDialogAction("send");
      setLoginDialogOpen(true);
      return;
    }

    const chatId = currentChatId;
    let isNewChat = false;
    let tempChatId: string | null = null;

    // === IMMEDIATE UI UPDATES (no waiting) ===
    if (!chatId || isPendingNewChat) {
      // Generate temporary chat ID for immediate UI feedback
      tempChatId = `temp-${Date.now()}`;
      const quickTitle = generateQuickTitle(message);

      // Add temporary chat to sidebar immediately
      const tempChat: Chat = {
        id: tempChatId,
        title: quickTitle,
        userId: "temp",
        createdAt: new Date(),
        updatedAt: new Date(),
        pinned: false,
      };
      setChats((prev) => [tempChat, ...prev]);
      setCurrentChatId(tempChatId);
      setIsPendingNewChat(false);
      isNewChat = true;

      // Don't set branch ID yet - will be set after chat is created in DB
    } // Add user message to UI immediately
    const newUserMsg = { sender: "User", text: message };

    // Update both UI state and branch state together
    setBranches((prev) => {
      if (!currentBranchId) return prev;
      return prev.map((branch) =>
        branch.id === currentBranchId
          ? { ...branch, messages: [...branch.messages, newUserMsg] }
          : branch,
      );
    });
    setMessages((prev) => [...prev, newUserMsg]);

    // Initialize empty AI message immediately
    const emptyAIMsg = { sender: "AI", text: "" };
    setBranches((prev) => {
      if (!currentBranchId) return prev;
      return prev.map((branch) =>
        branch.id === currentBranchId
          ? { ...branch, messages: [...branch.messages, emptyAIMsg] }
          : branch,
      );
    });
    setMessages((prev) => [...prev, emptyAIMsg]); // === START AI RESPONSE IMMEDIATELY (don't wait for DB) ===
    const conversationHistory = [...messages, newUserMsg];

    // Start AI response without waiting
    const aiResponsePromise = (async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: isNewChat ? null : chatId, // Use null for new chats, actual chatId for existing
            history: conversationHistory,
          }),
        });

        if (!response.ok) {
          console.error(`HTTP error ${response.status}`);
          return "";
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("text/event-stream")) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let completeAiText = "";
          let displayedLength = 0;
          const charDelay = 1;

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
                  completeAiText += token;

                  const newChars = completeAiText.slice(displayedLength);
                  for (let i = 0; i < newChars.length; i++) {
                    const targetLength = displayedLength + i + 1;
                    setTimeout(
                      () => {
                        const updatedText = completeAiText.slice(
                          0,
                          targetLength,
                        );
                        setMessages((prev) => {
                          const msgs = [...prev];
                          if (msgs[msgs.length - 1]?.sender === "AI") {
                            msgs[msgs.length - 1] = {
                              ...msgs[msgs.length - 1]!,
                              text: updatedText,
                            };
                          }
                          return msgs;
                        });
                        // Update branch in a separate state update
                        if (currentBranchId) {
                          setBranches((prevBranches) =>
                            prevBranches.map((branch) =>
                              branch.id === currentBranchId
                                ? {
                                    ...branch,
                                    messages: branch.messages.map(
                                      (msg, idx, arr) =>
                                        idx === arr.length - 1 &&
                                        msg.sender === "AI"
                                          ? { ...msg, text: updatedText }
                                          : msg,
                                    ),
                                  }
                                : branch,
                            ),
                          );
                        }
                      },
                      (displayedLength + i) * charDelay,
                    );
                  }
                  displayedLength = completeAiText.length;
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
          return completeAiText;
        }
      } catch (error) {
        console.error("Error getting AI response:", error);
        return "";
      }
      return "";
    })();

    // === BACKGROUND DATABASE OPERATIONS (async, non-blocking) ===
    void (async () => {
      try {
        let realChatId = chatId;
        let chatToUpdateInDB: Chat | null = null;

        // Create real chat in database if needed
        if (isNewChat && tempChatId) {
          const newChatFromDB = await createNewChat(); // Returns Chat | null
          if (newChatFromDB) {
            realChatId = newChatFromDB.id;
            chatToUpdateInDB = newChatFromDB; // Store for title update            // Update the temporary chat entry with real data from DB, keeping quickTitle for now
            setChats((prev) =>
              prev.map((c) =>
                c.id === tempChatId
                  ? { ...newChatFromDB, title: c.title } // Use newChatFromDB, preserve quickTitle
                  : c,
              ),
            );
            setCurrentChatId(newChatFromDB.id);

            // Load branches for the new chat
            try {
              const branchRes = await fetch(
                `/api/branches?chatId=${newChatFromDB.id}`,
              );
              if (branchRes.ok) {
                const data = (await branchRes.json()) as {
                  branches: Array<{ id: string; name: string }>;
                };
                const branchesWithMessages = data.branches.map((b) => ({
                  ...b,
                  messages: [],
                }));
                setBranches(branchesWithMessages);
                if (branchesWithMessages.length > 0) {
                  setCurrentBranchId(branchesWithMessages[0]!.id);
                }
              }
            } catch (err) {
              console.error("Failed to fetch branches for new chat:", err);
            }
          } else {
            console.error(
              "Failed to create real chat. Removing temporary chat.",
            );
            // Remove the temp chat from UI if creation fails
            setChats((prev) => prev.filter((c) => c.id !== tempChatId));
            if (currentChatId === tempChatId) {
              // Reset to a state where user can start another new chat or select existing
              setCurrentChatId(null);
              setMessages([]);
              setIsPendingNewChat(true); // Or call startNewChat() if it has the desired reset logic
            }
            return; // Stop further background processing for this failed chat
          }
        }

        // Save user message to database (async, non-blocking)
        const saveUserMessagePromise = realChatId
          ? saveMessage(realChatId, message, "user")
          : Promise.resolve();

        // Generate and update title (async, non-blocking)
        const titlePromise = (async () => {
          if (isNewChat && realChatId && chatToUpdateInDB) {
            let betterTitle = chatToUpdateInDB.title; // Default to quick title
            try {
              const titleGenResponse = await fetch(
                "/api/chats/generate-title",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ message }),
                },
              );
              if (titleGenResponse.ok) {
                const titleData =
                  (await titleGenResponse.json()) as GenerateTitleResponse;
                betterTitle = titleData.title;
              } else {
                console.warn(
                  "Failed to generate title from AI, using local fallback.",
                );
                // Fallback to local generation if API fails
                betterTitle =
                  message.length > 30
                    ? message.substring(0, 30) + "..."
                    : message;
              }
            } catch (error) {
              console.error(
                "Error calling generate-title API, using local fallback:",
                error,
              );
              betterTitle =
                message.length > 30
                  ? message.substring(0, 30) + "..."
                  : message;
            }

            // Update the chat title in local state immediately
            setChats((prev) =>
              prev.map((chat) =>
                chat.id === realChatId ? { ...chat, title: betterTitle } : chat,
              ),
            );

            // Update title in DB
            try {
              const res = await fetch(`/api/chats/${realChatId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: betterTitle }),
              });
              if (!res.ok) {
                console.error(
                  "Failed to update chat title in DB:",
                  await res.text(),
                );
                // Optionally revert local title if DB update fails, or notify user
              } else {
                console.log(
                  "Chat title updated in DB successfully:",
                  betterTitle,
                );
                // If server returns updated chat, can use it: const updatedChatFromDB = await res.json();
                // setChats(prev => prev.map(c => c.id === realChatId ? { ...c, ...updatedChatFromDB.chat } : c));
              }
            } catch (error) {
              console.error("Error updating chat title in DB:", error);
            }
          }
        })();

        // Wait for AI response and save it
        const completeAiText = await aiResponsePromise;
        const saveAiMessagePromise = completeAiText
          ? saveMessage(realChatId!, completeAiText, "assistant")
          : Promise.resolve();

        // Wait for all background operations to complete (optional)
        await Promise.all([
          saveUserMessagePromise,
          titlePromise,
          saveAiMessagePromise,
        ]);
      } catch (error) {
        console.error("Error in background database operations:", error);
      }
    })();
  };

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove chat from local state
        setChats((prev) => prev.filter((chat) => chat.id !== chatId));

        // If the deleted chat was the current one, clear the current chat
        if (currentChatId === chatId) {
          setCurrentChatId(null);
          setMessages([]);
          setIsPendingNewChat(false);
        }
      } else {
        console.error("Failed to delete chat:", response.status);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        // Update chat title in local state
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, title: newTitle } : chat,
          ),
        );
      } else {
        console.error("Failed to rename chat:", response.status);
      }
    } catch (error) {
      console.error("Error renaming chat:", error);
    }
  };

  const pinChat = async (chatId: string) => {
    try {
      const chat = chats.find((c) => c.id === chatId);
      if (!chat) return;

      const newPinnedState = !chat.pinned;

      const response = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: newPinnedState }),
      });

      if (response.ok) {
        // Update pinned status in local state
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, pinned: newPinnedState } : chat,
          ),
        );
      } else {
        console.error("Failed to pin/unpin chat:", response.status);
      }
    } catch (error) {
      console.error("Error pinning/unpinning chat:", error);
    }
  }; // Fetch chats when user signs in - with a delay to allow UI to settle and lazy load
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      // Add a delay to let the authentication UI settle and then lazy load chats
      const timer = setTimeout(() => {
        void fetchChats();
      }, 300); // Increased delay to ensure auth is fully settled
      return () => clearTimeout(timer);
    } else if (isLoaded && !isSignedIn) {
      // Clear chats when user signs out
      setChats([]);
      setCurrentChatId(null);
      setMessages([]);
      setIsPendingNewChat(false);
      setIsLoadingChats(false);
    }
  }, [isSignedIn, isLoaded, fetchChats]); // Sync messages to current branch when messages change (but avoid infinite loops)
  // Use a ref to track if we're in the middle of a branch switch to avoid syncing
  const isSwitchingBranch = useRef(false);
  // REMOVED: The useEffect that was causing infinite loops
  // We'll handle syncing manually in specific functions instead

  // Switch branches
  const selectBranch = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) return;

    // Set flag to prevent syncing during branch switch
    isSwitchingBranch.current = true;
    setCurrentBranchId(branchId);
    setMessages(branch.messages);

    // Reset flag after state updates
    setTimeout(() => {
      isSwitchingBranch.current = false;
    }, 0);
  }; // Compute branchIndex and count
  const branchIndex = branches.findIndex((b) => b.id === currentBranchId);
  const branchCount = branches.length;
  const prevBranch = () => {
    if (branchIndex > 0 && branches[branchIndex - 1]) {
      const prevId = branches[branchIndex - 1]!.id;
      selectBranch(prevId);
    }
  };
  const nextBranch = () => {
    if (branchIndex < branches.length - 1 && branches[branchIndex + 1]) {
      const nextId = branches[branchIndex + 1]!.id;
      selectBranch(nextId);
    }
  }; // Regenerate AI response for a given user message index
  const regenerateResponse = async (userMessageIndex: number) => {
    if (!currentChatId || !currentBranchId) return;
    const oldBranch = branches.find((b) => b.id === currentBranchId);
    if (!oldBranch) return;

    // IMPORTANT: Save current messages to the old branch before switching
    const currentMessages = [...messages];
    setBranches((prev) =>
      prev.map((branch) =>
        branch.id === currentBranchId
          ? { ...branch, messages: currentMessages }
          : branch,
      ),
    );

    // Get messages up to the point we want to regenerate from
    const initialMessages = currentMessages.slice(0, userMessageIndex + 1);
    const newBranchName = `Branch ${branches.length + 1}`;

    try {
      // Create new branch on server WITHOUT copying parent messages
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId,
          name: newBranchName,
          // Don't include parentBranchId to avoid copying messages
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          branch: { id: string; name: string };
        };

        // Save the initial messages to the new branch in the database
        for (const msg of initialMessages) {
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatId: currentChatId,
              content: msg.text,
              role: msg.sender === "User" ? "user" : "assistant",
              branchId: data.branch.id,
            }),
          });
        }

        // Add new branch to local state
        setBranches((prev) => [
          ...prev,
          {
            id: data.branch.id,
            name: data.branch.name,
            messages: initialMessages,
          },
        ]);

        // Switch to new branch
        isSwitchingBranch.current = true;
        setCurrentBranchId(data.branch.id);
        setMessages(initialMessages);
        isSwitchingBranch.current = false;

        // Generate new AI response directly without using sendMessage
        const lastUserMessage = initialMessages[userMessageIndex];
        if (lastUserMessage && lastUserMessage.sender === "User") {
          // Add empty AI message to UI
          const emptyAIMsg = { sender: "AI", text: "" };
          setMessages((prev) => [...prev, emptyAIMsg]);
          setBranches((prev) =>
            prev.map((branch) =>
              branch.id === data.branch.id
                ? { ...branch, messages: [...branch.messages, emptyAIMsg] }
                : branch,
            ),
          );

          // Get conversation history for AI context
          const conversationHistory = initialMessages.map((msg) => ({
            sender: msg.sender,
            text: msg.text,
          }));

          // Start AI response generation
          try {
            const aiResponse = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chatId: currentChatId,
                history: conversationHistory,
              }),
            });

            if (aiResponse.ok) {
              const contentType = aiResponse.headers.get("content-type") ?? "";
              if (contentType.includes("text/event-stream")) {
                const reader = aiResponse.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let completeAiText = "";
                let displayedLength = 0;
                const charDelay = 1;

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
                        completeAiText += token;

                        const newChars = completeAiText.slice(displayedLength);
                        for (let i = 0; i < newChars.length; i++) {
                          const targetLength = displayedLength + i + 1;
                          setTimeout(
                            () => {
                              const updatedText = completeAiText.slice(
                                0,
                                targetLength,
                              );
                              setMessages((prev) => {
                                const msgs = [...prev];
                                if (msgs[msgs.length - 1]?.sender === "AI") {
                                  msgs[msgs.length - 1] = {
                                    ...msgs[msgs.length - 1]!,
                                    text: updatedText,
                                  };
                                }
                                return msgs;
                              });
                              // Update branch in a separate state update
                              setBranches((prevBranches) =>
                                prevBranches.map((branch) =>
                                  branch.id === data.branch.id
                                    ? {
                                        ...branch,
                                        messages: branch.messages.map(
                                          (msg, idx, arr) =>
                                            idx === arr.length - 1 &&
                                            msg.sender === "AI"
                                              ? { ...msg, text: updatedText }
                                              : msg,
                                        ),
                                      }
                                    : branch,
                                ),
                              );
                            },
                            (displayedLength + i) * charDelay,
                          );
                        }
                        displayedLength = completeAiText.length;
                      }
                    } catch {
                      // Ignore parse errors
                    }
                  }
                }

                // Save final AI response to database
                if (completeAiText) {
                  await fetch("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      chatId: currentChatId,
                      content: completeAiText,
                      role: "assistant",
                      branchId: data.branch.id,
                    }),
                  });
                }
              }
            }
          } catch (error) {
            console.error("Error generating AI response:", error);
          }
        }
      } else {
        console.error("Failed to create branch on server");
      }
    } catch (error) {
      console.error("Error creating branch:", error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChatId,
        messages,
        loading,
        isLoadingChat,
        isPendingNewChat,
        isLoadingChats,
        branches,
        currentBranchId,
        selectBranch,
        regenerateResponse,
        prevBranch,
        nextBranch,
        branchIndex,
        branchCount,
        createNewChat,
        startNewChat,
        selectChat,
        sendMessage,
        fetchChats,
        deleteChat,
        renameChat,
        pinChat,
        loginDialogOpen,
        loginDialogAction,
        setLoginDialogOpen,
        setLoginDialogAction,
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
