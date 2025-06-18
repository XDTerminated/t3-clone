"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  hasApiKey: boolean;
  clearApiKey: () => void;
  isLoaded: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const API_KEY_STORAGE_KEY = "openrouter_api_key";

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored) {
      setApiKeyState(stored);
    }
    setIsLoaded(true);
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  };

  const clearApiKey = () => {
    setApiKeyState(null);
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  };
  const hasApiKey = Boolean(apiKey);

  return (
    <ApiKeyContext.Provider
      value={{ apiKey, setApiKey, hasApiKey, clearApiKey, isLoaded }}
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
