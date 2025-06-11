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

interface DeleteChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatTitle: string | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteChatDialog({
  open,
  onOpenChange,
  chatTitle,
  onConfirm,
  isDeleting = false,
}: DeleteChatDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg font-semibold">
            Delete Thread
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Are you sure you want to delete &quot;{chatTitle ?? "New Chat"}
            &quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="hover:bg-muted/40 hover:text-foreground disabled:hover:text-foreground/50 mt-2 disabled:hover:bg-transparent sm:mt-0"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:hover:bg-destructive shadow-sm"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
