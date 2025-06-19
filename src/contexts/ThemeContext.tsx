"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ColorTheme = "red" | "black";
export type ColorMode = "light" | "dark";

interface ThemeContextType {
  colorTheme: ColorTheme;
  colorMode: ColorMode;
  setColorTheme: (theme: ColorTheme) => void;
  setColorMode: (mode: ColorMode) => void;
  showThemeSelector: boolean;
  setShowThemeSelector: (show: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [colorTheme, setColorTheme] = useState<ColorTheme>("red");
  const [colorMode, setColorMode] = useState<ColorMode>("dark");
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  useEffect(() => {
    const savedColorTheme = localStorage.getItem("colorTheme") as ColorTheme;
    const savedColorMode = localStorage.getItem("colorMode") as ColorMode;

    if (savedColorTheme) {
      setColorTheme(savedColorTheme);
    }
    if (savedColorMode) {
      setColorMode(savedColorMode);
    } else {
      setColorMode("dark");
    }
  }, []);
  useEffect(() => {
    const html = document.documentElement;

    html.classList.remove(
      "theme-red",
      "theme-green",
      "theme-black",
      "theme-white",
      "theme-pink",
    );

    html.classList.add(`theme-${colorTheme}`);

    if (colorMode === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    localStorage.setItem("colorTheme", colorTheme);
    localStorage.setItem("colorMode", colorMode);
  }, [colorTheme, colorMode]);

  const value = {
    colorTheme,
    colorMode,
    setColorTheme,
    setColorMode,
    showThemeSelector,
    setShowThemeSelector,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
