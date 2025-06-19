"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Palette, Check } from "lucide-react";
import { useTheme, type ColorTheme } from "~/contexts/ThemeContext";
import { cn } from "~/lib/utils";

const colorThemes: Array<{
  id: ColorTheme;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
}> = [
  {
    id: "red",
    name: "Rose Red",
    description: "Warm and passionate",
    primaryColor: "bg-red-500",
    accentColor: "bg-red-100 dark:bg-red-900",
  },
  {
    id: "black",
    name: "Midnight Black",
    description: "Sleek and professional (under development)",
    primaryColor: "bg-gray-800",
    accentColor: "bg-gray-100 dark:bg-gray-900",
  },
];

export function ThemeSelectorDialog() {
  const { colorTheme, setColorTheme, showThemeSelector, setShowThemeSelector } =
    useTheme();
  const handleThemeSelect = (theme: ColorTheme) => {
    setColorTheme(theme);
    setTimeout(() => {
      setShowThemeSelector(false);
    }, 500);
  };

  return (
    <Dialog open={showThemeSelector} onOpenChange={setShowThemeSelector}>
      <DialogContent className="bg-background border-border sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Palette className="text-primary h-6 w-6" />
          </div>
          <DialogTitle className="text-foreground text-lg font-semibold">
            Choose Color Theme
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Select a color palette for your app interface
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 py-4">
          {colorThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                "hover:bg-muted/50 focus:ring-primary focus:ring-2 focus:outline-none",
                colorTheme === theme.id
                  ? "border-primary bg-primary/5"
                  : "border-border",
              )}
            >
              <div className="flex gap-2">
                <div
                  className={cn("h-4 w-4 rounded-full", theme.primaryColor)}
                />
                <div
                  className={cn("h-4 w-4 rounded-full", theme.accentColor)}
                />
              </div>

              <div className="flex-1">
                <div className="text-sm font-medium">{theme.name}</div>
                <div className="text-muted-foreground text-xs">
                  {theme.description}
                </div>
              </div>

              {colorTheme === theme.id && (
                <Check className="text-primary h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
