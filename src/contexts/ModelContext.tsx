"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { DEFAULT_MODEL, type OpenRouterModel } from "~/lib/openrouter";

interface ModelContextType {
  selectedModel: OpenRouterModel;
  setSelectedModel: (model: OpenRouterModel) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModel] =
    useState<OpenRouterModel>(DEFAULT_MODEL);

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
}
