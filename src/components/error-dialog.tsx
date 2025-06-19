"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  errorType?: string;
}

export function ErrorDialog({
  open,
  onOpenChange,
  title,
  message,
  errorType,
}: ErrorDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };
  const getActionButtons = () => {
    switch (errorType) {
      case "RATE_LIMIT":
        return (
          <>
            <Button
              variant="outline"
              onClick={handleClose}
              className="hover:bg-muted/40 hover:text-foreground"
            >
              Dismiss
            </Button>
            <Button
              onClick={() => {
                handleClose();
                // Could add retry logic here in the future
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              Got it
            </Button>
          </>
        );
      case "PAYMENT_REQUIRED":
        return (
          <>
            <Button
              variant="outline"
              onClick={handleClose}
              className="hover:bg-muted/40 hover:text-foreground"
            >
              Dismiss
            </Button>
            <Button
              onClick={() => {
                window.open("https://openrouter.ai/credits", "_blank");
                handleClose();
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              Check Account
            </Button>
          </>
        );
      case "INVALID_API_KEY":
      case "FORBIDDEN":
        return (
          <>
            <Button
              variant="outline"
              onClick={handleClose}
              className="hover:bg-muted/40 hover:text-foreground"
            >
              Dismiss
            </Button>
            <Button
              onClick={() => {
                window.open("https://openrouter.ai/keys", "_blank");
                handleClose();
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              Check API Keys
            </Button>
          </>
        );
      default:
        return (
          <Button
            onClick={handleClose}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            OK
          </Button>
        );
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-6 w-6" />
          </div>
          <DialogTitle className="text-foreground text-lg font-semibold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          {getActionButtons()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
