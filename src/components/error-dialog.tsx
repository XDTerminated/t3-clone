"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Dismiss
            </Button>
            <Button
              onClick={() => {
                handleClose();
                // Could add retry logic here in the future
              }}
            >
              Got it
            </Button>
          </div>
        );
      case "PAYMENT_REQUIRED":
        return (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Dismiss
            </Button>
            <Button
              onClick={() => {
                window.open("https://openrouter.ai/credits", "_blank");
                handleClose();
              }}
            >
              Check Account
            </Button>
          </div>
        );
      case "INVALID_API_KEY":
      case "FORBIDDEN":
        return (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Dismiss
            </Button>
            <Button
              onClick={() => {
                window.open("https://openrouter.ai/keys", "_blank");
                handleClose();
              }}
            >
              Check API Keys
            </Button>
          </div>
        );
      default:
        return <Button onClick={handleClose}>OK</Button>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">{title}</DialogTitle>
          <DialogDescription className="text-gray-700">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end">{getActionButtons()}</div>
      </DialogContent>
    </Dialog>
  );
}
