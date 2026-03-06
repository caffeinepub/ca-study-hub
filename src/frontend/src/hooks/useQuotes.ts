import { useCallback, useEffect, useRef, useState } from "react";
import { QUOTES, type Quote, type QuoteCategory } from "../data/quotes";

export type AutoRotateInterval = "off" | "30" | "60" | "120" | "300";

const LS_CATEGORY = "quotes-category-filter";
const LS_AUTO_ROTATE = "quotes-auto-rotate";
const LS_FAVORITES = "quotes-favorites";

function getFiltered(category: QuoteCategory | "all"): Quote[] {
  if (category === "all") return QUOTES;
  return QUOTES.filter((q) => q.category === category);
}

function pickRandom(pool: Quote[], exclude?: string): Quote {
  const available = exclude ? pool.filter((q) => q.id !== exclude) : pool;
  if (available.length === 0) return pool[0];
  return available[Math.floor(Math.random() * available.length)];
}

export function useQuotes() {
  const [category, setCategoryState] = useState<QuoteCategory | "all">(() => {
    const stored = localStorage.getItem(LS_CATEGORY);
    return (stored as QuoteCategory | "all") ?? "all";
  });

  const [autoRotate, setAutoRotateState] = useState<AutoRotateInterval>(() => {
    const stored = localStorage.getItem(LS_AUTO_ROTATE);
    return (stored as AutoRotateInterval) ?? "off";
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LS_FAVORITES);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  const filtered = getFiltered(category);
  const [currentQuote, setCurrentQuote] = useState<Quote>(() =>
    pickRandom(filtered),
  );
  const historyRef = useRef<Quote[]>([currentQuote]);
  const historyIndexRef = useRef<number>(0);

  // When category changes, pick a new random quote from new pool
  const setCategory = useCallback((cat: QuoteCategory | "all") => {
    setCategoryState(cat);
    localStorage.setItem(LS_CATEGORY, cat);
    const pool = getFiltered(cat);
    const next = pickRandom(pool);
    historyRef.current = [next];
    historyIndexRef.current = 0;
    setCurrentQuote(next);
  }, []);

  const setAutoRotate = useCallback((interval: AutoRotateInterval) => {
    setAutoRotateState(interval);
    localStorage.setItem(LS_AUTO_ROTATE, interval);
  }, []);

  const nextQuote = useCallback(() => {
    const pool = getFiltered(category);
    const next = pickRandom(pool, currentQuote.id);
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(next);
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setCurrentQuote(next);
  }, [category, currentQuote.id]);

  const prevQuote = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      setCurrentQuote(historyRef.current[historyIndexRef.current]);
    }
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id];
      localStorage.setItem(LS_FAVORITES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  const favoriteQuotes = QUOTES.filter((q) => favorites.includes(q.id));

  // Auto-rotate effect
  useEffect(() => {
    if (autoRotate === "off") return;
    const seconds = Number.parseInt(autoRotate, 10);
    const id = setInterval(() => {
      nextQuote();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [autoRotate, nextQuote]);

  return {
    currentQuote,
    category,
    autoRotate,
    favorites,
    favoriteQuotes,
    nextQuote,
    prevQuote,
    toggleFavorite,
    isFavorite,
    setCategory,
    setAutoRotate,
    filteredCount: filtered.length,
  };
}
