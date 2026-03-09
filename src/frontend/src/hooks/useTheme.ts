import { useEffect, useState } from "react";

export type Theme = "royal" | "sunset" | "anime" | "cute" | "lofi" | "earthly";
export type ColorMode = "dark" | "light";

const THEME_STORAGE_KEY = "ca-study-hub-theme";
const MODE_STORAGE_KEY = "ca-study-hub-color-mode";

export const THEME_LABELS: Record<Theme, string> = {
  royal: "Royal",
  sunset: "Sunset Cozy",
  anime: "Anime",
  cute: "Cute",
  lofi: "Lofi",
  earthly: "Earthly Royal",
};

export const THEME_DESCRIPTIONS: Record<Theme, string> = {
  royal: "Deep burgundy & gold — elegant & regal",
  sunset: "Warm oranges & amber — cozy & inviting",
  anime: "Vibrant pink & purple — playful & energetic",
  cute: "Soft pastels & mint — sweet & cheerful",
  lofi: "Muted browns & sage — chill & focused",
  earthly: "Deep forest green & gold — earthy & majestic",
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
  earthly: { bg: "#0d1f12", accent: "#c9a055", text: "#eee5c8" },
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
    // Migrate legacy "reality" theme to "royal"
    if (stored === "reality") return "royal";
    return (stored as Theme) || "royal";
  });

  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    // Default: dark for dark themes, light for light themes
    const storedTheme =
      (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "royal";
    return storedTheme === "sunset" || storedTheme === "cute"
      ? "light"
      : "dark";
  });

  useEffect(() => {
    applyThemeAndMode(theme, colorMode);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(MODE_STORAGE_KEY, colorMode);
  }, [theme, colorMode]);

  // Apply on mount (handle legacy "reality" migration)
  useEffect(() => {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    const storedTheme: Theme =
      raw === "reality" || !raw ? "royal" : (raw as Theme);
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
