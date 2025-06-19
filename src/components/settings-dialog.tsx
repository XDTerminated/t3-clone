"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useApiKey } from "~/contexts/ApiKeyContext";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    openRouterApiKey,
    geminiApiKey,
    groqApiKey,
    setOpenRouterApiKey,
    setGeminiApiKey,
    setGroqApiKey,
  } = useApiKey();
  const [newOpenRouterKey, setNewOpenRouterKey] = useState("");
  const [newGeminiKey, setNewGeminiKey] = useState("");
  const [newGroqKey, setNewGroqKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newOpenRouterKey.trim() &&
      !newGeminiKey.trim() &&
      !newGroqKey.trim()
    ) {
      setValidationError("Please enter at least one API key to update");
      return;
    }

    setIsValidating(true);
    setValidationError("");

    try {
      // Validate OpenRouter key if provided
      if (newOpenRouterKey.trim()) {
        const response = await fetch("/api/validate-openrouter-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKey: newOpenRouterKey.trim() }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          setValidationError(
            `OpenRouter: ${errorData.error ?? "Invalid API key"}`,
          );
          return;
        }

        // Update OpenRouter key if valid
        setOpenRouterApiKey(newOpenRouterKey.trim());
        setNewOpenRouterKey("");
      } // Update Gemini key if provided (no validation for now)
      if (newGeminiKey.trim()) {
        setGeminiApiKey(newGeminiKey.trim());
        setNewGeminiKey("");
      }

      // Update Groq key if provided (no validation for now)
      if (newGroqKey.trim()) {
        setGroqApiKey(newGroqKey.trim());
        setNewGroqKey("");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("API key validation failed:", error);
      setValidationError("Failed to validate API key. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };
  const handleCancel = () => {
    setNewOpenRouterKey("");
    setNewGeminiKey("");
    setNewGroqKey("");
    setValidationError("");
    onOpenChange(false);
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel();
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>{" "}
          <DialogDescription>
            Manage your API key settings. You can use OpenRouter for most
            models, Gemini for Google models, and Groq for fast inference.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OpenRouter API Key Section */}
          <div className="space-y-2">
            <label
              htmlFor="current-openrouter-key"
              className="text-sm font-medium"
            >
              Current OpenRouter API Key
            </label>
            <Input
              id="current-openrouter-key"
              type="password"
              value={
                openRouterApiKey ? "sk-or-v1-" + "•".repeat(32) : "Not set"
              }
              disabled
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="new-openrouter-key" className="text-sm font-medium">
              New OpenRouter API Key
            </label>
            <Input
              id="new-openrouter-key"
              type="password"
              placeholder="sk-or-v1-..."
              value={newOpenRouterKey}
              onChange={(e) => setNewOpenRouterKey(e.target.value)}
              className="font-mono text-sm"
              disabled={isValidating}
            />
          </div>
          {/* Gemini API Key Section */}
          <div className="space-y-2">
            <label htmlFor="current-gemini-key" className="text-sm font-medium">
              Current Gemini API Key
            </label>
            <Input
              id="current-gemini-key"
              type="password"
              value={geminiApiKey ? "AI" + "•".repeat(36) : "Not set"}
              disabled
              className="font-mono text-sm"
            />
          </div>{" "}
          <div className="space-y-2">
            <label htmlFor="new-gemini-key" className="text-sm font-medium">
              New Gemini API Key
            </label>
            <Input
              id="new-gemini-key"
              type="password"
              placeholder="AI..."
              value={newGeminiKey}
              onChange={(e) => setNewGeminiKey(e.target.value)}
              className="font-mono text-sm"
              disabled={isValidating}
            />
          </div>
          {/* Groq API Key Section */}
          <div className="space-y-2">
            <label htmlFor="current-groq-key" className="text-sm font-medium">
              Current Groq API Key
            </label>
            <Input
              id="current-groq-key"
              type="password"
              value={groqApiKey ? "gsk_" + "•".repeat(30) : "Not set"}
              disabled
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="new-groq-key" className="text-sm font-medium">
              New Groq API Key
            </label>
            <Input
              id="new-groq-key"
              type="password"
              placeholder="gsk_..."
              value={newGroqKey}
              onChange={(e) => setNewGroqKey(e.target.value)}
              className="font-mono text-sm"
              disabled={isValidating}
            />
          </div>
          {validationError && (
            <p className="text-sm text-red-600">{validationError}</p>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isValidating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isValidating ||
                (!newOpenRouterKey.trim() &&
                  !newGeminiKey.trim() &&
                  !newGroqKey.trim())
              }
            >
              {isValidating ? "Validating..." : "Update API Keys"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
