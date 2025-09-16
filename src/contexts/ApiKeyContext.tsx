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
  customOpenRouterModels: string[];
  setOpenRouterApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
  setGroqApiKey: (key: string) => void;
  addCustomOpenRouterModel: (modelId: string) => void;
  removeCustomOpenRouterModel: (modelId: string) => void;
  hasOpenRouterKey: boolean;
  hasGeminiKey: boolean;
  hasGroqKey: boolean;
  hasAnyKey: boolean;
  hasUserProvidedOpenRouterKey: boolean;
  hasUserProvidedGeminiKey: boolean;
  hasUserProvidedGroqKey: boolean;
  clearApiKeys: () => void;
  isLoaded: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const OPENROUTER_API_KEY_STORAGE_KEY = "openrouter_api_key";
const GEMINI_API_KEY_STORAGE_KEY = "gemini_api_key";
const GROQ_API_KEY_STORAGE_KEY = "groq_api_key";
const CUSTOM_OPENROUTER_MODELS_KEY = "custom_openrouter_models";
const USER_PROVIDED_OPENROUTER_FLAG = "user_provided_openrouter";
const USER_PROVIDED_GEMINI_FLAG = "user_provided_gemini";
const USER_PROVIDED_GROQ_FLAG = "user_provided_groq";

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [openRouterApiKey, setOpenRouterApiKeyState] = useState<string | null>(
    null,
  );
  const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(null);
  const [groqApiKey, setGroqApiKeyState] = useState<string | null>(null);
  const [customOpenRouterModels, setCustomOpenRouterModels] = useState<string[]>([]);
  const [userProvidedOpenRouter, setUserProvidedOpenRouter] = useState(false);
  const [userProvidedGemini, setUserProvidedGemini] = useState(false);
  const [userProvidedGroq, setUserProvidedGroq] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  // Load API keys from localStorage on mount
  useEffect(() => {
    const storedOpenRouter = localStorage.getItem(
      OPENROUTER_API_KEY_STORAGE_KEY,
    );
    const storedGemini = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    const storedGroq = localStorage.getItem(GROQ_API_KEY_STORAGE_KEY);
    const storedCustomModels = localStorage.getItem(CUSTOM_OPENROUTER_MODELS_KEY);
    
    const userProvidedOpenRouterFlag = localStorage.getItem(USER_PROVIDED_OPENROUTER_FLAG);
    const userProvidedGeminiFlag = localStorage.getItem(USER_PROVIDED_GEMINI_FLAG);
    const userProvidedGroqFlag = localStorage.getItem(USER_PROVIDED_GROQ_FLAG);

    if (storedOpenRouter && userProvidedOpenRouterFlag === "true") {
      setOpenRouterApiKeyState(storedOpenRouter);
      setUserProvidedOpenRouter(true);
    }
    if (storedGemini && userProvidedGeminiFlag === "true") {
      setGeminiApiKeyState(storedGemini);
      setUserProvidedGemini(true);
    }
    if (storedGroq && userProvidedGroqFlag === "true") {
      setGroqApiKeyState(storedGroq);
      setUserProvidedGroq(true);
    }
    if (storedCustomModels) {
      try {
        const parsedModels = JSON.parse(storedCustomModels) as string[];
        setCustomOpenRouterModels(parsedModels);
      } catch (error) {
        console.error("Failed to parse custom OpenRouter models:", error);
      }
    }
    setIsLoaded(true);
  }, []);
  const setOpenRouterApiKey = (key: string) => {
    setOpenRouterApiKeyState(key);
    setUserProvidedOpenRouter(true);
    localStorage.setItem(OPENROUTER_API_KEY_STORAGE_KEY, key);
    localStorage.setItem(USER_PROVIDED_OPENROUTER_FLAG, "true");
  };

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    setUserProvidedGemini(true);
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key);
    localStorage.setItem(USER_PROVIDED_GEMINI_FLAG, "true");
  };

  const setGroqApiKey = (key: string) => {
    setGroqApiKeyState(key);
    setUserProvidedGroq(true);
    localStorage.setItem(GROQ_API_KEY_STORAGE_KEY, key);
    localStorage.setItem(USER_PROVIDED_GROQ_FLAG, "true");
  };

  const addCustomOpenRouterModel = (modelId: string) => {
    const trimmedId = modelId.trim();
    if (!trimmedId || customOpenRouterModels.includes(trimmedId)) return;
    
    const updatedModels = [...customOpenRouterModels, trimmedId];
    setCustomOpenRouterModels(updatedModels);
    localStorage.setItem(CUSTOM_OPENROUTER_MODELS_KEY, JSON.stringify(updatedModels));
  };

  const removeCustomOpenRouterModel = (modelId: string) => {
    const updatedModels = customOpenRouterModels.filter(id => id !== modelId);
    setCustomOpenRouterModels(updatedModels);
    localStorage.setItem(CUSTOM_OPENROUTER_MODELS_KEY, JSON.stringify(updatedModels));
  };
  const clearApiKeys = () => {
    setOpenRouterApiKeyState(null);
    setGeminiApiKeyState(null);
    setGroqApiKeyState(null);
    setCustomOpenRouterModels([]);
    setUserProvidedOpenRouter(false);
    setUserProvidedGemini(false);
    setUserProvidedGroq(false);
    localStorage.removeItem(OPENROUTER_API_KEY_STORAGE_KEY);
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    localStorage.removeItem(GROQ_API_KEY_STORAGE_KEY);
    localStorage.removeItem(CUSTOM_OPENROUTER_MODELS_KEY);
    localStorage.removeItem(USER_PROVIDED_OPENROUTER_FLAG);
    localStorage.removeItem(USER_PROVIDED_GEMINI_FLAG);
    localStorage.removeItem(USER_PROVIDED_GROQ_FLAG);
  };

  const hasOpenRouterKey = Boolean(openRouterApiKey);
  const hasGeminiKey = Boolean(geminiApiKey);
  const hasGroqKey = Boolean(groqApiKey);
  const hasAnyKey = hasOpenRouterKey || hasGeminiKey || hasGroqKey;
  
  const hasUserProvidedOpenRouterKey = Boolean(openRouterApiKey && userProvidedOpenRouter);
  const hasUserProvidedGeminiKey = Boolean(geminiApiKey && userProvidedGemini);
  const hasUserProvidedGroqKey = Boolean(groqApiKey && userProvidedGroq);

  return (
    <ApiKeyContext.Provider
      value={{
        openRouterApiKey,
        geminiApiKey,
        groqApiKey,
        customOpenRouterModels,
        setOpenRouterApiKey,
        setGeminiApiKey,
        setGroqApiKey,
        addCustomOpenRouterModel,
        removeCustomOpenRouterModel,
        hasOpenRouterKey,
        hasGeminiKey,
        hasGroqKey,
        hasAnyKey,
        hasUserProvidedOpenRouterKey,
        hasUserProvidedGeminiKey,
        hasUserProvidedGroqKey,
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
