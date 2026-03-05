import { useEffect, useState } from "react";

export type Theme = "royal" | "sunset" | "anime" | "cute" | "lofi" | "reality";
export type ColorMode = "dark" | "light";

const THEME_STORAGE_KEY = "ca-study-hub-theme";
const MODE_STORAGE_KEY = "ca-study-hub-color-mode";

export const THEME_LABELS: Record<Theme, string> = {
  royal: "Royal",
  sunset: "Sunset Cozy",
  anime: "Anime",
  cute: "Cute",
  lofi: "Lofi",
  reality: "Reality",
};

export const THEME_DESCRIPTIONS: Record<Theme, string> = {
  royal: "Deep burgundy & gold — elegant & regal",
  sunset: "Warm oranges & amber — cozy & inviting",
  anime: "Vibrant pink & purple — playful & energetic",
  cute: "Soft pastels & mint — sweet & cheerful",
  lofi: "Muted browns & sage — chill & focused",
  reality: "Clean navy & slate — professional & crisp",
};

export const THEME_PREVIEW_COLORS: Record<
  Theme,
  { bg: string; accent: string; text: string }
> = {
  royal: { bg: "#1a0d14", accent: "#c9a84c", text: "#f5ead0" },
  sunset: { bg: "#fff5ee", accent: "#c2552b", text: "#3d2010" },
  anime: { bg: "#130d1f", accent: "#e040a0", text: "#f0eaff" },
  cute: { bg: "#fff0f5", accent: "#e8607a", text: "#3d1520" },
  lofi: { bg: "#2a2318", accent: "#a06040", text: "#ede0c8" },
  reality: { bg: "#f4f5f8", accent: "#2d3f7a", text: "#1a2040" },
};

function applyThemeAndMode(theme: Theme, mode: ColorMode) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-mode", mode);
  if (mode === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as Theme) || "royal";
  });

  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    // Default: dark for dark themes, light for light themes
    const storedTheme =
      (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "royal";
    return storedTheme === "sunset" ||
      storedTheme === "cute" ||
      storedTheme === "reality"
      ? "light"
      : "dark";
  });

  useEffect(() => {
    applyThemeAndMode(theme, colorMode);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(MODE_STORAGE_KEY, colorMode);
  }, [theme, colorMode]);

  // Apply on mount
  useEffect(() => {
    const storedTheme =
      (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "royal";
    const storedMode =
      (localStorage.getItem(MODE_STORAGE_KEY) as ColorMode) || "dark";
    applyThemeAndMode(storedTheme, storedMode);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
  };

  const toggleColorMode = () => {
    setColorModeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, setTheme, colorMode, setColorMode, toggleColorMode };
}
