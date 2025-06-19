"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ExternalLink, Key } from "lucide-react";

interface ApiKeyDialogProps {
  open: boolean;
  onApiKeysSubmit: (keys: {
    openRouterKey?: string;
    geminiKey?: string;
    groqKey?: string;
  }) => void;
}

export function ApiKeyDialog({ open, onApiKeysSubmit }: ApiKeyDialogProps) {
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Require at least one key
    if (!openRouterKey.trim() && !geminiKey.trim() && !groqKey.trim()) {
      alert("Please enter at least one API key.");
      return;
    }

    setIsValidating(true);

    try {
      const keys: {
        openRouterKey?: string;
        geminiKey?: string;
        groqKey?: string;
      } = {};

      // Validate OpenRouter key if provided
      if (openRouterKey.trim()) {
        const response = await fetch("/api/validate-openrouter-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: openRouterKey.trim() }),
        });

        if (response.ok) {
          keys.openRouterKey = openRouterKey.trim();
        } else {
          alert("Invalid OpenRouter API key. Please check and try again.");
          setIsValidating(false);
          return;
        }
      } // Add Gemini key if provided (no validation for now)
      if (geminiKey.trim()) {
        keys.geminiKey = geminiKey.trim();
      }

      // Add Groq key if provided (no validation for now)
      if (groqKey.trim()) {
        keys.groqKey = groqKey.trim();
      }

      onApiKeysSubmit(keys);
    } catch (error) {
      console.error("API key validation failed:", error);
      alert("Failed to validate API key. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* Prevent closing */
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        // Prevent closing by clicking outside or pressing escape
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Key className="text-primary h-6 w-6" />
          </div>{" "}
          <DialogTitle className="text-xl font-semibold">
            API Keys Required
          </DialogTitle>{" "}
          <p className="text-muted-foreground mt-2 text-sm">
            Enter your API keys to use AI models. You need at least one key to
            continue.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="openRouterKey" className="text-sm font-medium">
              OpenRouter API Key (for most models)
            </label>
            <Input
              id="openRouterKey"
              type="password"
              placeholder="sk-or-v1-..."
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              className="font-mono text-sm"
              autoFocus
            />
          </div>{" "}
          <div className="space-y-2">
            <label htmlFor="geminiKey" className="text-sm font-medium">
              Google Gemini API Key (for Gemini models)
            </label>
            <Input
              id="geminiKey"
              type="password"
              placeholder="AI..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="groqKey" className="text-sm font-medium">
              Groq API Key (for fast Groq models)
            </label>
            <Input
              id="groqKey"
              type="password"
              placeholder="gsk_..."
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Your API keys are stored locally and never sent to our servers
            except for validation.
          </p>
          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={
                (!openRouterKey.trim() &&
                  !geminiKey.trim() &&
                  !groqKey.trim()) ||
                isValidating
              }
            >
              {isValidating ? "Validating..." : "Continue"}
            </Button>{" "}
            <div className="space-y-2 text-center">
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
              >
                Get OpenRouter API key
                <ExternalLink className="h-3 w-3" />
              </a>
              <br />{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
              >
                Get Google API key
                <ExternalLink className="h-3 w-3" />
              </a>
              <br />
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
              >
                Get Groq API key
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
