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
  onApiKeySubmit: (apiKey: string) => void;
}

export function ApiKeyDialog({ open, onApiKeySubmit }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) return;

    setIsValidating(true);

    try {
      // Validate the API key by making a test request
      const response = await fetch("/api/validate-openrouter-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (response.ok) {
        onApiKeySubmit(apiKey.trim());
      } else {
        alert("Invalid OpenRouter API key. Please check and try again.");
      }
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
          </div>
          <DialogTitle className="text-xl font-semibold">
            OpenRouter API Key Required
          </DialogTitle>
          <p className="text-muted-foreground mt-2 text-sm">
            To use the AI models, please enter your OpenRouter API key. This
            will be stored locally in your browser.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
              required
              autoFocus
            />
            <p className="text-muted-foreground text-xs">
              Your API key is stored locally and never sent to our servers
              except for validation.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={!apiKey.trim() || isValidating}
            >
              {isValidating ? "Validating..." : "Continue"}
            </Button>

            <div className="text-center">
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
              >
                Get your API key from OpenRouter
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
