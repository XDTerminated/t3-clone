"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface ApiKeyContextType {
  openRouterApiKey: string | null;
  geminiApiKey: string | null;
  groqApiKey: string | null;
  setOpenRouterApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
  setGroqApiKey: (key: string) => void;
  hasOpenRouterKey: boolean;
  hasGeminiKey: boolean;
  hasGroqKey: boolean;
  hasAnyKey: boolean;
  clearApiKeys: () => void;
  isLoaded: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const OPENROUTER_API_KEY_STORAGE_KEY = "openrouter_api_key";
const GEMINI_API_KEY_STORAGE_KEY = "gemini_api_key";
const GROQ_API_KEY_STORAGE_KEY = "groq_api_key";

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [openRouterApiKey, setOpenRouterApiKeyState] = useState<string | null>(
    null,
  );
  const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(null);
  const [groqApiKey, setGroqApiKeyState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  // Load API keys from localStorage on mount
  useEffect(() => {
    const storedOpenRouter = localStorage.getItem(
      OPENROUTER_API_KEY_STORAGE_KEY,
    );
    const storedGemini = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    const storedGroq = localStorage.getItem(GROQ_API_KEY_STORAGE_KEY);

    if (storedOpenRouter) {
      setOpenRouterApiKeyState(storedOpenRouter);
    }
    if (storedGemini) {
      setGeminiApiKeyState(storedGemini);
    }
    if (storedGroq) {
      setGroqApiKeyState(storedGroq);
    }
    setIsLoaded(true);
  }, []);
  const setOpenRouterApiKey = (key: string) => {
    setOpenRouterApiKeyState(key);
    localStorage.setItem(OPENROUTER_API_KEY_STORAGE_KEY, key);
  };

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key);
  };

  const setGroqApiKey = (key: string) => {
    setGroqApiKeyState(key);
    localStorage.setItem(GROQ_API_KEY_STORAGE_KEY, key);
  };
  const clearApiKeys = () => {
    setOpenRouterApiKeyState(null);
    setGeminiApiKeyState(null);
    setGroqApiKeyState(null);
    localStorage.removeItem(OPENROUTER_API_KEY_STORAGE_KEY);
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    localStorage.removeItem(GROQ_API_KEY_STORAGE_KEY);
  };

  const hasOpenRouterKey = Boolean(openRouterApiKey);
  const hasGeminiKey = Boolean(geminiApiKey);
  const hasGroqKey = Boolean(groqApiKey);
  const hasAnyKey = hasOpenRouterKey || hasGeminiKey || hasGroqKey;

  return (
    <ApiKeyContext.Provider
      value={{
        openRouterApiKey,
        geminiApiKey,
        groqApiKey,
        setOpenRouterApiKey,
        setGeminiApiKey,
        setGroqApiKey,
        hasOpenRouterKey,
        hasGeminiKey,
        hasGroqKey,
        hasAnyKey,
        clearApiKeys,
        isLoaded,
      }}
    >
      {isLoaded && children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error("useApiKey must be used within an ApiKeyProvider");
  }
  return context;
}
