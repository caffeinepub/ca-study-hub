import { Heart, RefreshCw, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { CATEGORY_LABELS } from "../data/quotes";
import { useQuotes } from "../hooks/useQuotes";

interface QuoteWidgetProps {
  onNavigate?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  motivation: "var(--chart-1)",
  success: "var(--chart-2)",
  finance: "var(--chart-3)",
  balance: "var(--chart-4)",
  global: "var(--chart-5)",
};

export function QuoteWidget({ onNavigate }: QuoteWidgetProps) {
  const { currentQuote, autoRotate, nextQuote, toggleFavorite, isFavorite } =
    useQuotes();

  const catColor = CATEGORY_COLORS[currentQuote.category] ?? "var(--primary)";
  const favorited = isFavorite(currentQuote.id);

  return (
    <div
      data-ocid="quote_widget.card"
      className="relative rounded-2xl p-5 transition-all hover:scale-[1.005]"
      style={{
        background:
          "linear-gradient(135deg, oklch(var(--card)), oklch(var(--accent) / 0.15))",
        border: "1px solid oklch(var(--border))",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `oklch(${catColor} / 0.15)` }}
          >
            <Sparkles
              className="w-3.5 h-3.5"
              style={{ color: `oklch(${catColor})` }}
            />
          </div>
          <span
            className="text-xs font-heading font-semibold uppercase tracking-wide"
            style={{ color: `oklch(${catColor})` }}
          >
            {CATEGORY_LABELS[currentQuote.category]}
          </span>
          {autoRotate !== "off" && (
            <RefreshCw
              className="w-3 h-3 animate-spin"
              style={{
                color: "oklch(var(--muted-foreground))",
                animationDuration: "3s",
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Favorite button */}
          <button
            type="button"
            data-ocid="quote_widget.favorite.button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(currentQuote.id);
            }}
            className="p-1.5 rounded-lg transition-all hover:scale-110"
            style={{
              background: favorited
                ? "oklch(var(--destructive) / 0.12)"
                : "transparent",
            }}
            aria-label={
              favorited ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart
              className="w-4 h-4"
              style={{
                color: favorited
                  ? "oklch(var(--destructive))"
                  : "oklch(var(--muted-foreground))",
                fill: favorited ? "oklch(var(--destructive))" : "none",
              }}
            />
          </button>

          {/* Next button */}
          <button
            type="button"
            data-ocid="quote_widget.next.button"
            onClick={(e) => {
              e.stopPropagation();
              nextQuote();
            }}
            className="p-1.5 rounded-lg transition-all hover:scale-110"
            style={{ background: "transparent" }}
            aria-label="Next quote"
          >
            <RefreshCw
              className="w-4 h-4"
              style={{ color: "oklch(var(--muted-foreground))" }}
            />
          </button>
        </div>
      </div>

      {/* Quote text */}
      <motion.div
        key={currentQuote.id}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <blockquote
          className="font-display text-sm italic leading-relaxed mb-2"
          style={{ color: "oklch(var(--foreground))" }}
        >
          &ldquo;{currentQuote.text}&rdquo;
        </blockquote>
        <footer className="flex items-center justify-between">
          <div>
            <cite
              className="not-italic text-xs font-heading font-semibold"
              style={{ color: "oklch(var(--primary))" }}
            >
              — {currentQuote.author}
            </cite>
            {currentQuote.source && (
              <span
                className="text-xs font-heading ml-1"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                · {currentQuote.source}
              </span>
            )}
          </div>
          <button
            type="button"
            data-ocid="quote_widget.quotes_page.link"
            onClick={() => onNavigate?.()}
            className="text-xs font-heading underline-offset-2 hover:underline"
            style={{ color: "oklch(var(--primary))" }}
          >
            View all →
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
