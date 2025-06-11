"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { LogIn } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "send" | "chat";
}

export function LoginDialog({ open, onOpenChange, action }: LoginDialogProps) {
  const handleSignIn = () => {
    // Navigate directly to Google OAuth using replace for faster navigation
    window.location.replace("/sign-in/google");
  };

  const getActionText = () => {
    switch (action) {
      case "send":
        return "send messages";
      case "chat":
        return "create new chats";
      default:
        return "continue";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg font-semibold">
            Sign In Required
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Please sign in with your Google account to {getActionText()}. This
            helps us keep your conversations secure and personalized.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="hover:bg-muted/40 hover:text-foreground mt-2 sm:mt-0"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSignIn}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <LogIn className="mr-2 size-4" />
            Sign in with Google
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
