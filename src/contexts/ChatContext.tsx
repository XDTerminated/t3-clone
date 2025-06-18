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
import type { UploadFileResponse, ChatMessage } from "~/lib/types";

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
  messages: Array<{
    sender: string;
    text: string;
    files?: UploadFileResponse[];
    reasoning?: string; // Add reasoning field
  }>;
  loading: boolean;
  isLoadingChat: boolean;
  isPendingNewChat: boolean;
  isLoadingChats: boolean; // Loading state for sidebar chats
  isGeneratingResponse: boolean; // New: Track if AI is generating
  queuedMessages: ChatMessage[]; // New: Message queue
  // Error dialog state
  errorDialogOpen: boolean;
  errorDialogTitle: string;
  errorDialogMessage: string;
  errorDialogType?: string;
  setErrorDialogOpen: (open: boolean) => void;
  showErrorDialog: (title: string, message: string, errorType?: string) => void;
  createNewChat: () => Promise<Chat | null>; // Changed return type
  startNewChat: () => void;
  selectChat: (chatId: string) => Promise<void>;
  sendMessage: (data: ChatMessage) => Promise<void>;
  fetchChats: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, newTitle: string) => Promise<void>;
  pinChat: (chatId: string) => Promise<void>;
  // Login dialog state
  loginDialogOpen: boolean;
  loginDialogAction: "send" | "chat" | null;
  setLoginDialogOpen: (open: boolean) => void;
  setLoginDialogAction: (action: "send" | "chat" | null) => void;
  // API Key dialog state
  apiKeyDialogOpen: boolean;
  setApiKeyDialogOpen: (open: boolean) => void;
  handleApiKeySubmit: (apiKey: string) => void;
  // Settings dialog state
  settingsDialogOpen: boolean;
  setSettingsDialogOpen: (open: boolean) => void;
  branches: {
    id: string;
    name: string;
    messages: Array<{
      sender: string;
      text: string;
      files?: UploadFileResponse[];
      reasoning?: string; // Add reasoning field to branches too
    }>;
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
  const { hasApiKey, setApiKey, apiKey, isLoaded: apiKeyLoaded } = useApiKey();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Array<{
      sender: string;
      text: string;
      files?: UploadFileResponse[];
      reasoning?: string;
    }>
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
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

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

  // Message queue system
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState<ChatMessage[]>([]);

  // Error dialog state
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogTitle, setErrorDialogTitle] = useState("");
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  const [errorDialogType, setErrorDialogType] = useState<string | undefined>(
    undefined,
  );

  // Ref to avoid circular dependency in processQueue

  // Set sendMessage ref to avoid circular dependency

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
  const createNewChat = useCallback(async (): Promise<Chat | null> => {
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
  }, [isSignedIn]);
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
                    files?: string; // JSON string from database
                    reasoning?: string; // Add reasoning field
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

                const uiMessages = sortedMessages.map((msg) => {
                  let parsedFiles: UploadFileResponse[] | undefined;
                  try {
                    parsedFiles = msg.files
                      ? typeof msg.files === "string"
                        ? (JSON.parse(msg.files) as UploadFileResponse[])
                        : (msg.files as UploadFileResponse[])
                      : undefined;
                  } catch (error) {
                    console.error("Failed to parse files for message:", error);
                    parsedFiles = undefined;
                  }
                  return {
                    sender: msg.role === "user" ? "User" : "AI",
                    text: msg.content,
                    files: parsedFiles,
                    reasoning: msg.reasoning, // Include reasoning from database
                  };
                });
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
              files?: string; // JSON string from database
              reasoning?: string; // Add reasoning field
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
          const uiMessages = sortedMessages.map((msg) => {
            let parsedFiles: UploadFileResponse[] | undefined;
            try {
              parsedFiles = msg.files
                ? typeof msg.files === "string"
                  ? (JSON.parse(msg.files) as UploadFileResponse[])
                  : (msg.files as UploadFileResponse[])
                : undefined;
            } catch (error) {
              console.error("Failed to parse files for message:", error);
              parsedFiles = undefined;
            }
            return {
              sender: msg.role === "user" ? "User" : "AI",
              text: msg.content,
              files: parsedFiles,
              reasoning: msg.reasoning, // Include reasoning from database
            };
          });
          setMessages(uiMessages);
        }
      } catch (fallbackErr) {
        console.error("Failed to load messages:", fallbackErr);
        setMessages([]);
      }
    }

    setIsLoadingChat(false);
  };
  const ensureBranchExists = useCallback(
    async (chatId: string): Promise<string> => {
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
    },
    [currentBranchId, branches, setCurrentBranchId, setBranches],
  );

  const saveMessage = useCallback(
    async (
      chatId: string,
      content: string,
      role: "user" | "assistant",
      branchId: string,
      files?: UploadFileResponse[],
      wasRegenerated = false,
      reasoning?: string,
    ) => {
      try {
        console.log("Saving message:", {
          chatId,
          content: content.substring(0, 50) + "...",
          role,
          currentBranchId: currentBranchId,
          branchId: branchId, // Log the branch ID being used
          hasReasoning: !!reasoning,
        });

        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId,
            content,
            role,
            branchId,
            files: files ? JSON.stringify(files) : undefined,
            wasRegenerated,
            reasoning,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Failed to save message: ${response.status} ${response.statusText} - ${errorText}`,
          );
          throw new Error("Failed to save message");
        }

        console.log("Message saved successfully");
      } catch (error) {
        console.error("Error saving message:", error);
        throw error;
      }
    },
    [currentBranchId],
  );
  const generateQuickTitle = useCallback((message: string): string => {
    // Generate a quick title from the first message for immediate UI feedback
    const words = message.trim().split(/\s+/).slice(0, 6);
    return words.join(" ") + (words.length >= 6 ? "..." : "");
  }, []);

  const showErrorDialog = useCallback(
    (title: string, message: string, errorType?: string) => {
      setErrorDialogTitle(title);
      setErrorDialogMessage(message);
      setErrorDialogType(errorType);
      setErrorDialogOpen(true);
    },
    [],
  );

  const sendMessage = useCallback(
    (data: ChatMessage): Promise<void> => {
      if (!isSignedIn) {
        setLoginDialogAction("send");
        setLoginDialogOpen(true);
        return Promise.resolve();
      }
      if (!hasApiKey) {
        setApiKeyDialogOpen(true);
        return Promise.resolve();
      }

      // If AI is currently generating, add to queue
      if (isGeneratingResponse) {
        setQueuedMessages((prev) => [...prev, data]);
        return Promise.resolve();
      }

      // Set generating state
      setIsGeneratingResponse(true);

      const { message, searchEnabled, files } = data;
      const userMessage = { sender: "User", text: message, files };
      const aiPlaceholder = { sender: "AI", text: "", files: undefined };

      // We need the history for the API call *before* we update the state
      const historyForApi = [...messages, userMessage].map((msg) => ({
        sender: msg.sender,
        text: msg.text,
      }));

      // Optimistically update UI with user message and AI placeholder
      setMessages((prev) => [...prev, userMessage, aiPlaceholder]);

      // Fire-and-forget all backend operations, but return the promise to match the type
      return (async () => {
        let chatId = currentChatId;
        let branchId = currentBranchId;
        const isNewChat = !chatId;
        let tempChatId: string | null = null;

        try {
          // Handle chat creation for new conversations
          if (isNewChat) {
            tempChatId = `temp-${Date.now()}`;
            const quickTitle = generateQuickTitle(message);
            const tempChat: Chat = {
              id: tempChatId,
              title: quickTitle,
              userId: "temp", // Will be updated with real ID
              createdAt: new Date(),
              updatedAt: new Date(),
              pinned: false,
            };
            setChats((prev) => [tempChat, ...prev]);
            setCurrentChatId(tempChatId);

            const newChatFromDB = await createNewChat();
            if (newChatFromDB) {
              chatId = newChatFromDB.id;
              // Update the temporary chat item with the real one from the DB
              setChats((prev) =>
                prev.map((c) =>
                  c.id === tempChatId
                    ? { ...newChatFromDB, title: quickTitle }
                    : c,
                ),
              );
              setCurrentChatId(chatId);
            } else {
              throw new Error("Failed to create new chat in database.");
            }
          }

          if (!chatId) {
            throw new Error("Chat ID is not available.");
          }

          branchId = await ensureBranchExists(chatId);
          if (!branchId) {
            throw new Error("Branch is not available.");
          }

          // Save user message in the background
          void saveMessage(chatId, message, "user", branchId, files);

          // Get AI response
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              history: historyForApi,
              model: selectedModel.id,
              apiKey,
              searchEnabled,
              files,
              chatId,
            }),
          });
          if (!response.ok || !response.body) {
            let errorMessage =
              "An error occurred while processing your request.";
            let errorType: string | undefined;

            try {
              const errorData = (await response.json()) as {
                error?: string;
                errorType?: string;
              };
              if (errorData.error) {
                errorMessage = errorData.error;
              }
              if (errorData.errorType) {
                errorType = errorData.errorType;
              }
            } catch {
              // If JSON parsing fails, use default error
              errorMessage = `API request failed: ${response.status} ${response.statusText}`;
            }

            throw new Error(
              JSON.stringify({ message: errorMessage, type: errorType }),
            );
          }

          // Check if this is an image generation response
          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            // This might be an image generation response
            try {
              const jsonResponse = (await response.json()) as {
                reply?: string;
                generatedImage?: {
                  url: string;
                  prompt: string;
                };
              };
              if (jsonResponse.generatedImage) {
                // Handle image generation response
                const imageUrl = jsonResponse.generatedImage.url;
                const prompt = jsonResponse.generatedImage.prompt;

                // Add AI message with generated image
                const aiMessage = {
                  sender: "AI",
                  text: `I've generated an image based on your prompt: "${prompt}"`,
                  files: [
                    {
                      name: "generated-image.png",
                      size: 0,
                      key: "",
                      url: imageUrl,
                      serverData: { type: "image/png", isGenerated: true },
                    },
                  ] as UploadFileResponse[],
                };

                setMessages((prev) => [...prev, aiMessage]);

                // Save AI message with image
                void saveMessage(
                  chatId,
                  aiMessage.text,
                  "assistant",
                  branchId,
                  aiMessage.files,
                );

                // Generate and update title for new chats (specifically for image generation)
                if (isNewChat) {
                  void (async () => {
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
                        const { title } =
                          (await titleGenResponse.json()) as GenerateTitleResponse;
                        // Update title in DB
                        void fetch(`/api/chats/${chatId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ title }),
                        });
                        // Update title in UI
                        setChats((prev) =>
                          prev.map((c) =>
                            c.id === chatId ? { ...c, title } : c,
                          ),
                        );
                      }
                    } catch (e) {
                      console.error(
                        "Title generation failed for image generation:",
                        e,
                      );
                    }
                  })();
                }

                setIsGeneratingResponse(false);
                return; // Exit early for image generation
              }
            } catch (e) {
              console.warn(
                "Failed to parse JSON response, falling back to stream:",
                e,
              );
            }
          }

          // Stream the response (for regular text models)
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let completeAiText = "";
          let completeReasoning = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Split on complete SSE messages (data: ... followed by double newline)
            const parts = buffer.split(/\n\n/);

            // Keep the last part in buffer (might be incomplete)
            buffer = parts.pop() ?? "";

            for (const part of parts) {
              const lines = part.trim().split(/\n/);
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;

                const dataStr = line.slice(6).trim(); // Remove "data: " prefix
                if (dataStr === "[DONE]") {
                  // End of stream
                  continue;
                }

                try {
                  const parsed = JSON.parse(dataStr) as {
                    token?: string;
                    reasoning?: string;
                    choices?: Array<{
                      delta?: {
                        content?: string;
                        reasoning?: string;
                      };
                    }>;
                  };

                  // Handle different response formats
                  let contentToken = "";
                  let reasoningToken = "";

                  if (parsed.token) {
                    contentToken = parsed.token;
                  } else if (parsed.choices?.[0]?.delta?.content) {
                    contentToken = parsed.choices[0].delta.content;
                  }

                  if (parsed.reasoning) {
                    reasoningToken = parsed.reasoning;
                  } else if (parsed.choices?.[0]?.delta?.reasoning) {
                    reasoningToken = parsed.choices[0].delta.reasoning;
                  }

                  if (contentToken) {
                    completeAiText += contentToken;
                  }

                  if (reasoningToken) {
                    completeReasoning += reasoningToken;
                  }

                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage?.sender === "AI") {
                      lastMessage.text = completeAiText;
                      if (completeReasoning) {
                        lastMessage.reasoning = completeReasoning;
                      }
                    }
                    return newMessages;
                  });
                } catch (e) {
                  console.warn("Failed to parse stream chunk:", dataStr, e);
                }
              }
            }
          }

          // Save complete AI message in the background
          if (completeAiText) {
            // Clean up the final AI text before saving and displaying
            const cleanedAiText = completeAiText
              .replace(/^[\s\u200B-\u200D\uFEFF]+/, "") // Remove leading whitespace/invisible chars
              .trim();

            // Update the UI with the cleaned text
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage?.sender === "AI") {
                lastMessage.text = cleanedAiText;
                if (completeReasoning) {
                  lastMessage.reasoning = completeReasoning.trim();
                }
              }
              return newMessages;
            });

            void saveMessage(
              chatId,
              cleanedAiText,
              "assistant",
              branchId,
              undefined,
              false,
              completeReasoning.trim() || undefined,
            );
          }

          // Generate and update title for new chats in the background
          if (isNewChat) {
            void (async () => {
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
                  const { title } =
                    (await titleGenResponse.json()) as GenerateTitleResponse;
                  // Update title in DB
                  void fetch(`/api/chats/${chatId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title }),
                  });
                  // Update title in UI
                  setChats((prev) =>
                    prev.map((c) => (c.id === chatId ? { ...c, title } : c)),
                  );
                }
              } catch (e) {
                console.error("Title generation failed.", e);
              }
            })();
          }
        } catch (error) {
          console.error("Error in sendMessage:", error);

          // Parse structured error if available
          let errorMessage = "Sorry, an error occurred.";
          let errorType: string | undefined;
          let dialogTitle = "Error";

          if (error instanceof Error) {
            try {
              // Try to parse structured error
              const errorData = JSON.parse(error.message) as {
                message?: string;
                type?: string;
              };
              if (errorData.message) {
                errorMessage = errorData.message;
              }
              if (errorData.type) {
                errorType = errorData.type;
                // Set appropriate dialog titles for different error types
                switch (errorType) {
                  case "RATE_LIMIT":
                    dialogTitle = "Rate Limit Exceeded";
                    break;
                  case "PAYMENT_REQUIRED":
                    dialogTitle = "Payment Required";
                    break;
                  case "INVALID_API_KEY":
                    dialogTitle = "Invalid API Key";
                    break;
                  case "FORBIDDEN":
                    dialogTitle = "Access Forbidden";
                    break;
                  default:
                    dialogTitle = "Error";
                }
              }
            } catch {
              // If not structured error, use the original error message
              errorMessage = `Sorry, an error occurred. ${error.message}`;
            }
          }

          // Show error dialog
          showErrorDialog(dialogTitle, errorMessage, errorType);

          // Update UI to show generic error in chat
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage?.sender === "AI") {
              lastMessage.text =
                "Sorry, there was an error processing your request. Please check the error details above.";
            }
            return newMessages;
          });

          // If chat creation failed, remove the temporary chat from the UI
          if (isNewChat && tempChatId) {
            setChats((prev) => prev.filter((c) => c.id !== tempChatId));
            if (currentChatId === tempChatId) {
              setCurrentChatId(null);
              setIsPendingNewChat(true);
            }
          }
        } finally {
          // Always clear generating state
          setIsGeneratingResponse(false);
        }
      })();
    },
    [
      isSignedIn,
      hasApiKey,
      isGeneratingResponse,
      messages,
      currentChatId,
      currentBranchId,
      selectedModel.id,
      apiKey,
      createNewChat,
      ensureBranchExists,
      saveMessage,
      generateQuickTitle,
      showErrorDialog,
    ],
  );
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
        ); // Save the initial messages to the new branch in the database using robust saveMessage
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
              msg.files, // Include files from the original message
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
          const emptyAIMsg = { sender: "AI", text: "", files: undefined };
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
          ); // Get conversation history for AI context and extract files from user message
          const conversationHistory = initialMessages.map((msg) => ({
            sender: msg.sender,
            text: msg.text,
          }));

          // Extract files from the last user message for regeneration
          const lastUserMsg = initialMessages[userMessageIndex];
          const userFiles = lastUserMsg?.files;

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
                files: userFiles, // Include the files from the original user message
              }),
            });

            if (aiResponse.ok) {
              const contentType = aiResponse.headers.get("content-type") ?? "";
              if (contentType.includes("text/event-stream")) {
                const reader = aiResponse.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let completeAiText = "";
                let completeReasoning = "";

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });

                  // Split on complete SSE messages (data: ... followed by double newline)
                  const parts = buffer.split(/\n\n/);

                  // Keep the last part in buffer (might be incomplete)
                  buffer = parts.pop() ?? "";

                  for (const part of parts) {
                    const lines = part.trim().split(/\n/);
                    for (const line of lines) {
                      if (!line.startsWith("data: ")) continue;

                      const dataStr = line.slice(6).trim(); // Remove "data: " prefix
                      if (dataStr === "[DONE]") {
                        // End of stream
                        continue;
                      }

                      try {
                        const parsed = JSON.parse(dataStr) as {
                          token?: string;
                          reasoning?: string;
                          choices?: Array<{
                            delta?: {
                              content?: string;
                              reasoning?: string;
                            };
                          }>;
                        };

                        // Handle different response formats
                        let contentToken = "";
                        let reasoningToken = "";

                        if (parsed.token) {
                          contentToken = parsed.token;
                        } else if (parsed.choices?.[0]?.delta?.content) {
                          contentToken = parsed.choices[0].delta.content;
                        }

                        if (parsed.reasoning) {
                          reasoningToken = parsed.reasoning;
                        } else if (parsed.choices?.[0]?.delta?.reasoning) {
                          reasoningToken = parsed.choices[0].delta.reasoning;
                        }

                        if (contentToken) {
                          completeAiText += contentToken;
                        }

                        if (reasoningToken) {
                          completeReasoning += reasoningToken;
                        }

                        setMessages((prev) => {
                          const newMessages = [...prev];
                          const lastMessage =
                            newMessages[newMessages.length - 1];
                          if (lastMessage?.sender === "AI") {
                            lastMessage.text = completeAiText;
                            if (completeReasoning) {
                              lastMessage.reasoning = completeReasoning;
                            }
                          }
                          return newMessages;
                        });

                        // Update branch state as well
                        setBranches((prevBranches) =>
                          prevBranches.map((branch) =>
                            branch.id === data.branch.id
                              ? {
                                  ...branch,
                                  messages: branch.messages.map(
                                    (msg, idx, arr) =>
                                      idx === arr.length - 1 &&
                                      msg.sender === "AI"
                                        ? {
                                            ...msg,
                                            text: completeAiText,
                                            reasoning: completeReasoning,
                                          }
                                        : msg,
                                  ),
                                }
                              : branch,
                          ),
                        );

                        // Update the alternative text in real-time
                        setMessageAlternatives((prev) => {
                          const newMap = new Map(prev);
                          const alternatives = newMap.get(userMessageIndex + 1);
                          if (alternatives && alternatives.length > 0) {
                            const updatedAlternatives = alternatives.map(
                              (alt) =>
                                alt.branchId === data.branch.id
                                  ? { ...alt, text: completeAiText }
                                  : alt,
                            );
                            newMap.set(
                              userMessageIndex + 1,
                              updatedAlternatives,
                            );
                          }
                          return newMap;
                        });
                      } catch (e) {
                        console.warn(
                          "Failed to parse stream chunk:",
                          dataStr,
                          e,
                        );
                      }
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
                      undefined, // No files for AI response
                      false, // wasRegenerated
                      completeReasoning || undefined, // Include reasoning if present
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

      // Group branches by their conversation history up to each message position
      // This allows us to find all alternatives for each regenerated message
      const messagePositionGroups = new Map<
        string, // historyKey (conversation up to this point)
        Map<number, Array<{ branchId: string; text: string }>> // messageIndex -> alternatives
      >();

      branches.forEach((branch) => {
        const branchHistory: string[] = [];

        branch.messages.forEach((message, messageIndex) => {
          // Build history key up to this message (excluding current message)
          const historyKey = branchHistory.join("|");

          if (message.sender === "AI") {
            // This is an AI message - check if we have alternatives for this position
            if (!messagePositionGroups.has(historyKey)) {
              messagePositionGroups.set(historyKey, new Map());
            }

            const positionMap = messagePositionGroups.get(historyKey)!;
            if (!positionMap.has(messageIndex)) {
              positionMap.set(messageIndex, []);
            }

            // Add this AI response as an alternative
            const alternatives = positionMap.get(messageIndex)!;
            const existingIndex = alternatives.findIndex(
              (alt) => alt.branchId === branch.id,
            );

            if (existingIndex === -1) {
              alternatives.push({
                branchId: branch.id,
                text: message.text,
              });
            }
          }

          // Add current message to history for next iteration
          branchHistory.push(`${message.sender}:${message.text}`);
        });
      });

      // Now process the groups to find regenerated messages (positions with multiple alternatives)
      for (const [, positionMap] of messagePositionGroups) {
        for (const [messageIndex, alternatives] of positionMap) {
          // Only consider positions with multiple alternatives (i.e., regenerated messages)
          if (alternatives.length > 1) {
            // Check if any of these alternatives belong to the current branch
            const currentBranchAlternative = alternatives.find(
              (alt) => alt.branchId === currentBranchId,
            );

            if (currentBranchAlternative) {
              // Sort alternatives by creation order (branch ID should correlate with creation time)
              const sortedAlternatives = [...alternatives].sort((a, b) =>
                a.branchId.localeCompare(b.branchId),
              );

              newMessageAlternatives.set(messageIndex, sortedAlternatives);

              // Set current selection to the alternative from the current branch
              const currentIndex = sortedAlternatives.findIndex(
                (alt) => alt.branchId === currentBranchId,
              );

              if (currentIndex >= 0) {
                newCurrentSelections.set(messageIndex, currentIndex);
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
    if (apiKeyLoaded && isLoaded && isSignedIn && !hasApiKey) {
      setApiKeyDialogOpen(true);
    }
  }, [apiKeyLoaded, isLoaded, isSignedIn, hasApiKey]);

  // Handle API key submission
  const handleApiKeySubmit = useCallback(
    (apiKey: string) => {
      setApiKey(apiKey);
      setApiKeyDialogOpen(false);
    },
    [setApiKey],
  ); // Process queue when generation finishes
  useEffect(() => {
    if (!isGeneratingResponse && queuedMessages.length > 0) {
      // Get the next message and remove it from queue
      const nextMessage = queuedMessages[0];
      if (nextMessage) {
        setQueuedMessages((prev) => prev.slice(1));
        // Process the message by calling sendMessage
        setTimeout(() => {
          void sendMessage(nextMessage);
        }, 100);
      }
    }
  }, [isGeneratingResponse, queuedMessages, sendMessage]);

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
        isGeneratingResponse,
        queuedMessages,
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
        settingsDialogOpen,
        setSettingsDialogOpen,
        errorDialogOpen,
        errorDialogTitle,
        errorDialogMessage,
        errorDialogType,
        setErrorDialogOpen,
        showErrorDialog,
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
