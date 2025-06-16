"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useModel } from "./ModelContext";
import { useAuth } from "@clerk/nextjs";
import { useApiKey } from "./ApiKeyContext";
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
  pinChat: (chatId: string) => Promise<void>;
  // Login dialog state
  loginDialogOpen: boolean;
  loginDialogAction: "send" | "chat" | null;
  setLoginDialogOpen: (open: boolean) => void;
  setLoginDialogAction: (action: "send" | "chat" | null) => void; // API Key dialog state
  apiKeyDialogOpen: boolean;
  setApiKeyDialogOpen: (open: boolean) => void;
  handleApiKeySubmit: (apiKey: string) => void;
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
  regeneratedMessageIndices: Set<number>;
  // New: Message-level alternative tracking
  messageAlternatives: Map<number, Array<{ branchId: string; text: string }>>;
  currentMessageAlternatives: Map<number, number>; // messageIndex -> selectedAlternativeIndex
  selectMessageAlternative: (
    messageIndex: number,
    alternativeIndex: number,
  ) => void;
  getMessageAlternativeInfo: (
    messageIndex: number,
  ) => { current: number; total: number } | null;
  // New: Check if a message allows navigation (no unregenerated messages after it)
  isMessageNavigable: (messageIndex: number) => boolean;
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
  const { selectedModel } = useModel();
  const { hasApiKey, setApiKey, apiKey } = useApiKey();
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
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

  // Branching support
  const [branches, setBranches] = useState<
    {
      id: string;
      name: string;
      messages: Array<{ sender: string; text: string }>;
    }[]
  >([]);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
  const [regeneratedMessageIndices, setRegeneratedMessageIndices] = useState<
    Set<number>
  >(new Set()); // Message-level alternative tracking
  const [messageAlternatives, setMessageAlternatives] = useState<
    Map<number, Array<{ branchId: string; text: string }>>
  >(new Map());
  const [currentMessageAlternatives, setCurrentMessageAlternatives] = useState<
    Map<number, number>
  >(new Map()); // messageIndex -> selectedAlternativeIndex
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

    // Check if user has API key
    if (!hasApiKey) {
      setApiKeyDialogOpen(true);
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
    setRegeneratedMessageIndices(new Set());
    setMessageAlternatives(new Map());
    setCurrentMessageAlternatives(new Map());
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

    // Clear branch state to prevent stale data
    setBranches([]);
    setCurrentBranchId(null);

    // Add a small delay to ensure smooth transition
    await new Promise((resolve) => setTimeout(resolve, 150)); // Load branches for the chat
    let firstBranchId: string | null = null;
    try {
      const branchRes = await fetch(`/api/branches?chatId=${chatId}`);
      if (branchRes.ok) {
        const data = (await branchRes.json()) as {
          branches: Array<{ id: string; name: string }>;
        }; // Load messages for ALL branches to ensure persistence
        const branchesWithMessages = await Promise.all(
          data.branches.map(async (branch) => {
            try {
              console.log(`Loading messages for branch ${branch.id}`);
              const msgRes = await fetch(
                `/api/messages?chatId=${chatId}&branchId=${branch.id}`,
              );
              if (msgRes.ok) {
                const msgData = (await msgRes.json()) as {
                  messages: Array<{
                    role: string;
                    content: string;
                    createdAt: string;
                  }>;
                };

                // Simple sort by createdAt timestamp
                const sortedMessages = [...msgData.messages];
                sortedMessages.sort((a, b) => {
                  const dateA = new Date(a.createdAt).getTime();
                  const dateB = new Date(b.createdAt).getTime();
                  return dateA - dateB;
                });

                const uiMessages = sortedMessages.map((msg) => ({
                  sender: msg.role === "user" ? "User" : "AI",
                  text: msg.content,
                }));
                console.log(
                  `Loaded ${uiMessages.length} messages for branch ${branch.id}`,
                );
                return { ...branch, messages: uiMessages };
              } else {
                console.error(
                  `Failed to load messages for branch ${branch.id}: ${msgRes.status} ${msgRes.statusText}`,
                );
              }
            } catch (err) {
              console.error(
                `Failed to load messages for branch ${branch.id}:`,
                err,
              );
            }
            console.log(`Returning empty messages for branch ${branch.id}`);
            return { ...branch, messages: [] };
          }),
        );
        setBranches(branchesWithMessages);

        if (branchesWithMessages.length > 0) {
          firstBranchId = branchesWithMessages[0]!.id;
          setCurrentBranchId(firstBranchId);
          // Set messages from the first branch
          console.log(
            "Setting messages from first branch on selectChat:",
            branchesWithMessages[0]!.messages.length,
            "messages",
          );
          setMessages(branchesWithMessages[0]!.messages);
        }
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err); // Fallback to loading messages without branches
      try {
        const response = await fetch(`/api/messages?chatId=${chatId}`);
        if (response.ok) {
          const msgData = (await response.json()) as {
            messages: Array<{
              role: string;
              content: string;
              createdAt: string;
            }>;
          };

          // Simple sort by createdAt timestamp
          const sortedMessages = [...msgData.messages];
          sortedMessages.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB;
          });

          const uiMessages = sortedMessages.map((msg) => ({
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
  const ensureBranchExists = async (chatId: string): Promise<string> => {
    // Verify that the current branch actually belongs to this chat
    if (currentBranchId) {
      try {
        const verifyRes = await fetch(`/api/branches?chatId=${chatId}`);
        if (verifyRes.ok) {
          const data = (await verifyRes.json()) as {
            branches: Array<{ id: string; name: string }>;
          };
          const branchExists = data.branches.find(
            (b) => b.id === currentBranchId,
          );
          if (branchExists) {
            console.log("Current branch verified for chat:", currentBranchId);
            return currentBranchId;
          } else {
            console.log(
              "Current branch doesn't belong to this chat, clearing it",
            );
            setCurrentBranchId(null);
            setBranches([]);
          }
        }
      } catch (error) {
        console.error("Failed to verify current branch:", error);
        setCurrentBranchId(null);
        setBranches([]);
      }
    }

    // Try to find any existing branch in our local state that belongs to this chat
    if (branches.length > 0) {
      // Verify that these branches actually belong to this chat
      try {
        const verifyRes = await fetch(`/api/branches?chatId=${chatId}`);
        if (verifyRes.ok) {
          const data = (await verifyRes.json()) as {
            branches: Array<{ id: string; name: string }>;
          };
          const localBranchExists = data.branches.find(
            (b) => b.id === branches[0]!.id,
          );
          if (localBranchExists) {
            const branchId = branches[0]!.id;
            setCurrentBranchId(branchId);
            return branchId;
          } else {
            console.log(
              "Local branches don't belong to this chat, clearing them",
            );
            setBranches([]);
          }
        }
      } catch (error) {
        console.error("Failed to verify local branches:", error);
        setBranches([]);
      }
    }

    // Fetch branches from server with retries
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(
          `Fetching branches for chat ${chatId}, attempt ${attempt + 1}`,
        );
        const branchRes = await fetch(`/api/branches?chatId=${chatId}`);
        if (branchRes.ok) {
          const data = (await branchRes.json()) as {
            branches: Array<{ id: string; name: string }>;
          };
          if (data.branches.length > 0) {
            const branchId = data.branches[0]!.id;
            console.log("Found existing branch:", branchId);
            setCurrentBranchId(branchId);
            // Update local branches state
            setBranches(data.branches.map((b) => ({ ...b, messages: [] })));
            // Small delay to ensure state updates have propagated
            await new Promise((resolve) => setTimeout(resolve, 50));
            return branchId;
          }
        }
      } catch (error) {
        console.error(
          `Failed to fetch branches on attempt ${attempt + 1}:`,
          error,
        );
      }

      // Wait before retrying (exponential backoff)
      if (attempt < 2) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 100),
        );
      }
    }

    // If no branches exist, create a Main branch
    console.log("No branches found, creating Main branch for chat:", chatId);
    try {
      const createBranchRes = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          name: "Main",
        }),
      });

      if (createBranchRes.ok) {
        const data = (await createBranchRes.json()) as {
          branch: { id: string; name: string };
        };
        console.log("Created new Main branch:", data.branch.id);
        setCurrentBranchId(data.branch.id);
        setBranches([{ ...data.branch, messages: [] }]);
        // Small delay to ensure state updates have propagated
        await new Promise((resolve) => setTimeout(resolve, 50));
        return data.branch.id;
      } else {
        throw new Error(`Failed to create branch: ${createBranchRes.status}`);
      }
    } catch (error) {
      console.error("Failed to create Main branch:", error);
      throw new Error("Could not ensure branch exists");
    }
  };
  const saveMessage = async (
    chatId: string,
    content: string,
    role: "user" | "assistant",
    forceBranchId?: string, // Add optional parameter to force specific branch
  ) => {
    console.log("Saving message:", {
      chatId,
      content: content.substring(0, 50) + "...",
      role,
      currentBranchId: currentBranchId,
      forceBranchId: forceBranchId, // Log the forced branch ID
    });

    // Use forced branch ID if provided, otherwise ensure we have a valid branch
    let branchIdToUse: string;
    if (forceBranchId) {
      branchIdToUse = forceBranchId;
      console.log("Using forced branch ID:", branchIdToUse);
    } else {
      try {
        branchIdToUse = await ensureBranchExists(chatId);
        console.log("Branch ID to use for saving:", branchIdToUse);
      } catch (error) {
        console.error("Failed to ensure branch exists:", error);
        // Fallback: try to save without branchId (let the API create the Main branch)
        branchIdToUse = "";
      }
    }

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
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
        if (branchIdToUse) {
          requestBody.branchId = branchIdToUse;
        }

        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          console.log("Message saved successfully");
          return;
        }

        const errorText = await response.text();
        console.error(
          `Save attempt ${attempt + 1} failed:`,
          response.status,
          errorText,
        );

        // If it's a branch not found error, try to refresh and get a new branch
        if (response.status === 404 && errorText.includes("Branch not found")) {
          console.log("Branch not found, attempting to refresh branch...");
          try {
            branchIdToUse = await ensureBranchExists(chatId);
          } catch (refreshError) {
            console.error("Failed to refresh branch:", refreshError);
            // On last attempt, try without branchId
            if (attempt === 2) {
              branchIdToUse = "";
            }
          }
        }

        // On last attempt, throw the error
        if (attempt === 2) {
          throw new Error(
            `Failed to save message after 3 attempts: ${response.status} "${response.statusText}"`,
          );
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 200),
        );
      } catch (fetchError) {
        console.error(`Network error on attempt ${attempt + 1}:`, fetchError);

        if (attempt === 2) {
          throw fetchError;
        }

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 200),
        );
      }
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

    // Check if user has API key
    if (!hasApiKey) {
      setApiKeyDialogOpen(true);
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
            model: selectedModel.id,
            apiKey: apiKey, // Send user's API key
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
            setCurrentChatId(newChatFromDB.id); // Ensure branches are properly set up for the new chat BEFORE continuing
            try {
              const branchId = await ensureBranchExists(newChatFromDB.id);
              console.log(
                "Successfully ensured branches exist for new chat, branchId:",
                branchId,
              );
              // Make sure the currentBranchId is set before we continue
              setCurrentBranchId(branchId);
              // Small delay to ensure state updates have propagated
              await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (err) {
              console.error(
                "Failed to ensure branches exist for new chat:",
                err,
              );
              return; // Don't continue if we can't set up branches
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
        } // Save user message to database FIRST (ensure proper ordering)
        if (realChatId) {
          try {
            await saveMessage(realChatId, message, "user");
          } catch (error) {
            console.error("Failed to save user message:", error);
          }
        }

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
        })(); // Wait for AI response and save it AFTER user message
        const completeAiText = await aiResponsePromise;
        if (completeAiText && realChatId) {
          try {
            await saveMessage(realChatId, completeAiText, "assistant");
          } catch (error) {
            console.error("Failed to save AI message:", error);
          }
        }

        // Wait for title generation to complete (optional)
        await titlePromise.catch((error) => {
          console.error("Failed to update title:", error);
        });
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
        setChats((prev) => prev.filter((chat) => chat.id !== chatId)); // If the deleted chat was the current one, clear the current chat
        if (currentChatId === chatId) {
          setCurrentChatId(null);
          setMessages([]);
          setIsPendingNewChat(false);
          // Clear branch state to prevent stale data          setBranches([]);
          setCurrentBranchId(null);
          setRegeneratedMessageIndices(new Set());
          setMessageAlternatives(new Map());
          setCurrentMessageAlternatives(new Map());
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
      setMessageAlternatives(new Map());
      setCurrentMessageAlternatives(new Map());
    }
  }, [isSignedIn, isLoaded, fetchChats]); // Sync messages to current branch when messages change (but avoid infinite loops)  // Use a ref to track if we're in the middle of a branch switch to avoid syncing
  const isSwitchingBranch = useRef(false);
  const isSelectingMessageAlternative = useRef(false);
  // REMOVED: The useEffect that was causing infinite loops
  // We'll handle syncing manually in specific functions instead
  // Switch branches
  const selectBranch = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) return;

    console.log(
      "Switching to branch:",
      branchId,
      "with",
      branch.messages.length,
      "messages",
    );

    // Set flag to prevent syncing during branch switch
    isSwitchingBranch.current = true;
    setCurrentBranchId(branchId);
    setMessages(branch.messages);

    // Reset flag after state updates
    setTimeout(() => {
      isSwitchingBranch.current = false;
    }, 0);
  };

  // Compute branchIndex and count
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
        }; // Wait a brief moment to ensure the branch is fully created in the database
        await new Promise((resolve) => setTimeout(resolve, 100)); // Switch to new branch FIRST so saveMessage uses the correct branch
        isSwitchingBranch.current = true;
        console.log(
          "Switching to new branch for message saving:",
          data.branch.id,
        );
        setCurrentBranchId(data.branch.id);

        // Wait a moment for the state to update
        await new Promise((resolve) => setTimeout(resolve, 50));
        console.log(
          "About to save",
          initialMessages.length,
          "messages to new branch",
          data.branch.id,
        );
        console.log(
          "Initial messages being saved:",
          initialMessages.map((m) => ({
            sender: m.sender,
            text: m.text.substring(0, 50) + "...",
          })),
        );

        // Save the initial messages to the new branch in the database using robust saveMessage
        // Pass the new branch ID directly to avoid async state update issues
        for (const msg of initialMessages) {
          try {
            console.log(
              "Saving message to new branch:",
              msg.text.substring(0, 50) + "...",
            );
            await saveMessage(
              currentChatId,
              msg.text,
              msg.sender === "User" ? "user" : "assistant",
              data.branch.id, // Force use of the new branch ID
            );
          } catch (error) {
            console.error("Error saving message to new branch:", error);
            // Continue with other messages even if one fails
          }
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

        // Set messages and reset switching flag
        setMessages(initialMessages);
        isSwitchingBranch.current = false; // Generate new AI response directly without using sendMessage
        const lastUserMessage = initialMessages[userMessageIndex];
        if (lastUserMessage && lastUserMessage.sender === "User") {
          // Add empty AI message to UI
          const emptyAIMsg = { sender: "AI", text: "" };
          setMessages((prev) => [...prev, emptyAIMsg]); // Track that this AI message (at userMessageIndex + 1) is regenerated
          setRegeneratedMessageIndices((prev) =>
            new Set(prev).add(userMessageIndex + 1),
          );

          // Add the new alternative to our tracking
          const aiMessageIndex = userMessageIndex + 1;
          setMessageAlternatives((prev) => {
            const newMap = new Map(prev);
            let alternatives = newMap.get(aiMessageIndex) ?? [];

            // If this is the first time regenerating this specific message position,
            // add the original message as the first alternative
            if (alternatives.length === 0) {
              const originalMessage = currentMessages[aiMessageIndex];
              if (originalMessage && originalMessage.sender === "AI") {
                alternatives = [
                  {
                    branchId: currentBranchId || "unknown", // Use current branch as the source
                    text: originalMessage.text,
                  },
                ];
              }
            }

            // Add the new empty response as an alternative (will be filled during streaming)
            const newAlternatives = [
              ...alternatives,
              {
                branchId: data.branch.id,
                text: "",
              },
            ];

            newMap.set(aiMessageIndex, newAlternatives);
            return newMap;
          }); // Set current selection to the new alternative (always the last one added)
          setCurrentMessageAlternatives((prev) => {
            const newMap = new Map(prev);
            // We know we just added a new alternative. If this was the first regeneration,
            // we now have 2 alternatives (original + new), so index 1 is the new one.
            // If this was a subsequent regeneration, we added to existing alternatives,
            // so the new one is at the last index.
            const wasFirstRegeneration = !prev.has(aiMessageIndex);
            const newIndex = wasFirstRegeneration
              ? 1
              : (prev.get(aiMessageIndex) ?? 0) + 1;
            newMap.set(aiMessageIndex, newIndex);
            return newMap;
          });

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
                model: selectedModel.id,
                apiKey: apiKey, // Send user's API key
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

                              // Update the alternative text in real-time
                              setMessageAlternatives((prev) => {
                                const newMap = new Map(prev);
                                const alternatives = newMap.get(
                                  userMessageIndex + 1,
                                );
                                if (alternatives && alternatives.length > 0) {
                                  const updatedAlternatives = alternatives.map(
                                    (alt) =>
                                      alt.branchId === data.branch.id
                                        ? { ...alt, text: updatedText }
                                        : alt,
                                  );
                                  newMap.set(
                                    userMessageIndex + 1,
                                    updatedAlternatives,
                                  );
                                }
                                return newMap;
                              });
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
                } // Save final AI response to database using robust saveMessage
                if (completeAiText) {
                  try {
                    await saveMessage(
                      currentChatId,
                      completeAiText,
                      "assistant",
                      data.branch.id, // Force use of the new branch ID
                    );
                    console.log("AI response saved successfully");
                  } catch (error) {
                    console.error("Failed to save AI response:", error);
                  }
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
  // Select a specific alternative for a message
  const selectMessageAlternative = (
    messageIndex: number,
    alternativeIndex: number,
  ) => {
    const alternatives = messageAlternatives.get(messageIndex);
    if (!alternatives || alternativeIndex >= alternatives.length) return;

    const selectedAlternative = alternatives[alternativeIndex];
    if (!selectedAlternative) return;

    // Set flag to prevent useEffect from running during this operation
    isSelectingMessageAlternative.current = true;

    // Update the current selection
    setCurrentMessageAlternatives((prev) =>
      new Map(prev).set(messageIndex, alternativeIndex),
    );

    // Update the message text in the messages array
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === messageIndex ? { ...msg, text: selectedAlternative.text } : msg,
      ),
    );

    // Switch to the branch that contains this alternative
    if (selectedAlternative.branchId !== currentBranchId) {
      selectBranch(selectedAlternative.branchId);
    }

    // Reset flag after all updates
    setTimeout(() => {
      isSelectingMessageAlternative.current = false;
    }, 0);
  }; // Get alternative info for a specific message
  const getMessageAlternativeInfo = (
    messageIndex: number,
  ): { current: number; total: number } | null => {
    const alternatives = messageAlternatives.get(messageIndex);
    if (!alternatives || alternatives.length <= 1) return null;

    // CRITICAL FIX: Only show alternatives if the current message text actually exists in the alternatives
    // This prevents showing alternatives for messages that were never regenerated in the current context
    const currentMessage = messages[messageIndex];
    if (!currentMessage) return null;

    // Check if the current message text exists in the alternatives
    const matchingAlternativeIndex = alternatives.findIndex(
      (alt) => alt.text === currentMessage.text,
    );

    // If the current message text is not found in alternatives, don't show navigation
    if (matchingAlternativeIndex === -1) return null;

    const currentIndex =
      currentMessageAlternatives.get(messageIndex) ?? matchingAlternativeIndex;
    return {
      current: currentIndex + 1,
      total: alternatives.length,
    };
  };
  // Check if a message allows navigation - simplified: just check if it has alternatives
  const isMessageNavigable = (messageIndex: number): boolean => {
    const alternatives = messageAlternatives.get(messageIndex);
    return alternatives ? alternatives.length > 1 : false;
  };
  // Update message alternatives when branches change
  useEffect(() => {
    // Don't update if we're in the middle of selecting a message alternative or switching branches
    if (isSelectingMessageAlternative.current || isSwitchingBranch.current)
      return; // Don't update if we're still loading a chat to prevent interference
    if (isLoadingChat) return;

    // Don't update if there's no current branch selected
    if (!currentBranchId) return;

    // Don't update if branches are empty
    if (branches.length === 0) return;

    // Debounce the effect to prevent infinite loops
    const timeoutId = setTimeout(() => {
      console.log(
        "useEffect: updating indices for",
        branches.length,
        "branches",
      );

      if (branches.length === 0) {
        setMessageAlternatives(new Map());
        setCurrentMessageAlternatives(new Map());
        return;
      } // Rebuild alternatives from loaded branch data
      // This is needed after reload to restore the alternatives that were created through regeneration
      const newMessageAlternatives = new Map<
        number,
        Array<{ branchId: string; text: string }>
      >();
      const newCurrentSelections = new Map<number, number>();

      // To properly detect regenerated messages, we need to find branches that share
      // a common conversation history and have different AI responses at the same position

      // First, build a map of conversation histories for each branch
      const branchHistories = new Map<
        string,
        {
          fullHistory: string[];
          lastUserMessageIndex: number;
          lastAIMessageIndex: number;
          lastAIMessage: string;
        }
      >();

      branches.forEach((branch) => {
        const fullHistory: string[] = [];
        let lastUserMessageIndex = -1;
        let lastAIMessageIndex = -1;
        let lastAIMessage = "";

        branch.messages.forEach((message, index) => {
          fullHistory.push(`${message.sender}:${message.text}`);
          if (message.sender === "User") {
            lastUserMessageIndex = index;
          } else if (message.sender === "AI") {
            lastAIMessageIndex = index;
            lastAIMessage = message.text;
          }
        });

        branchHistories.set(branch.id, {
          fullHistory,
          lastUserMessageIndex,
          lastAIMessageIndex,
          lastAIMessage,
        });
      });

      // Find regenerated messages by looking for branches with identical history up to a point,
      // but different AI responses at that point
      for (const [branchId1, history1] of branchHistories) {
        for (const [branchId2, history2] of branchHistories) {
          if (branchId1 >= branchId2) continue; // Avoid duplicates

          // Check if these branches have a common prefix but diverge at an AI response
          let commonPrefixLength = 0;
          const minLength = Math.min(
            history1.fullHistory.length,
            history2.fullHistory.length,
          );

          for (let i = 0; i < minLength; i++) {
            if (history1.fullHistory[i] === history2.fullHistory[i]) {
              commonPrefixLength++;
            } else {
              break;
            }
          }

          // If there's a divergence and both branches have at least one more message after the common prefix
          if (commonPrefixLength < minLength && commonPrefixLength > 0) {
            // Check if the divergence is at an AI message position
            const divergentMessage1 = history1.fullHistory[commonPrefixLength];
            const divergentMessage2 = history2.fullHistory[commonPrefixLength];

            if (
              divergentMessage1?.startsWith("AI:") &&
              divergentMessage2?.startsWith("AI:")
            ) {
              // This indicates a regeneration - same conversation up to this point, different AI responses
              const aiText1 = divergentMessage1.substring(3); // Remove "AI:" prefix
              const aiText2 = divergentMessage2.substring(3); // Remove "AI:" prefix

              // Find the message index in each branch for this regenerated position
              const branch1 = branches.find((b) => b.id === branchId1);
              const branch2 = branches.find((b) => b.id === branchId2);

              if (branch1 && branch2) {
                const messageIndex1 = commonPrefixLength;
                const messageIndex2 = commonPrefixLength;

                // Add alternatives for both branches if they're within valid range
                if (
                  messageIndex1 < branch1.messages.length &&
                  messageIndex2 < branch2.messages.length
                ) {
                  // For branch 1
                  if (branchId1 === currentBranchId) {
                    const alternatives = [
                      { branchId: branchId1, text: aiText1 },
                      { branchId: branchId2, text: aiText2 },
                    ];
                    newMessageAlternatives.set(messageIndex1, alternatives);

                    // Set current selection
                    const currentIndex = alternatives.findIndex(
                      (alt) => alt.text === aiText1,
                    );
                    if (currentIndex >= 0) {
                      newCurrentSelections.set(messageIndex1, currentIndex);
                    }
                  }

                  // For branch 2
                  if (branchId2 === currentBranchId) {
                    const alternatives = [
                      { branchId: branchId1, text: aiText1 },
                      { branchId: branchId2, text: aiText2 },
                    ];
                    newMessageAlternatives.set(messageIndex2, alternatives);

                    // Set current selection
                    const currentIndex = alternatives.findIndex(
                      (alt) => alt.text === aiText2,
                    );
                    if (currentIndex >= 0) {
                      newCurrentSelections.set(messageIndex2, currentIndex);
                    }
                  }
                }
              }
            }
          }
        }
      }
      const newRegeneratedIndices = new Set<number>();

      // Get regenerated indices from the newly built messageAlternatives
      for (const [messageIndex, alternatives] of newMessageAlternatives) {
        if (alternatives.length > 1) {
          newRegeneratedIndices.add(messageIndex);
        }
      }

      setRegeneratedMessageIndices(newRegeneratedIndices);
      setMessageAlternatives(newMessageAlternatives);
      setCurrentMessageAlternatives(newCurrentSelections);
    }, 100); // 100ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [branches, currentBranchId, isLoadingChat, messageAlternatives]);

  // Auto-show API key dialog when user is signed in but has no API key
  useEffect(() => {
    if (isLoaded && isSignedIn && !hasApiKey) {
      setApiKeyDialogOpen(true);
    }
  }, [isLoaded, isSignedIn, hasApiKey]);

  // Handle API key submission
  const handleApiKeySubmit = useCallback(
    (apiKey: string) => {
      setApiKey(apiKey);
      setApiKeyDialogOpen(false);
    },
    [setApiKey],
  );

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
        regeneratedMessageIndices,
        messageAlternatives,
        currentMessageAlternatives,
        selectMessageAlternative,
        getMessageAlternativeInfo,
        isMessageNavigable,
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
        apiKeyDialogOpen,
        setApiKeyDialogOpen,
        handleApiKeySubmit,
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
