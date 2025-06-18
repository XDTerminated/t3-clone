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
  const { apiKey, setApiKey } = useApiKey();
  const [newApiKey, setNewApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newApiKey.trim()) {
      setValidationError("Please enter an API key");
      return;
    }

    setIsValidating(true);
    setValidationError("");

    try {
      const response = await fetch("/api/validate-openrouter-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: newApiKey.trim() }),
      });

      if (response.ok) {
        // API key is valid, update it
        setApiKey(newApiKey.trim());
        setNewApiKey("");
        onOpenChange(false);
      } else {
        const errorData = (await response.json()) as { error?: string };
        setValidationError(errorData.error ?? "Invalid API key");
      }
    } catch (error) {
      console.error("API key validation failed:", error);
      setValidationError("Failed to validate API key. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleCancel = () => {
    setNewApiKey("");
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
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your OpenRouter API key settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="current-api-key" className="text-sm font-medium">
              Current API Key
            </label>
            <Input
              id="current-api-key"
              type="password"
              value={apiKey ? "sk-or-v1-" + "•".repeat(32) : "Not set"}
              disabled
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="new-api-key" className="text-sm font-medium">
              New API Key
            </label>
            <Input
              id="new-api-key"
              type="password"
              placeholder="sk-or-v1-..."
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className="font-mono text-sm"
              disabled={isValidating}
            />
            {validationError && (
              <p className="text-sm text-red-600">{validationError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isValidating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isValidating || !newApiKey.trim()}>
              {isValidating ? "Validating..." : "Update API Key"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
