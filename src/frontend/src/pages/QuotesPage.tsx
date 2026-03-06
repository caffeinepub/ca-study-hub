import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  RefreshCw,
  Settings2,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORY_LABELS, QUOTES, type QuoteCategory } from "../data/quotes";
import { type AutoRotateInterval, useQuotes } from "../hooks/useQuotes";

const ALL_CATEGORIES: Array<QuoteCategory | "all"> = [
  "all",
  "motivation",
  "success",
  "finance",
  "balance",
  "global",
];

const CATEGORY_COLORS: Record<string, string> = {
  motivation: "var(--chart-1)",
  success: "var(--chart-2)",
  finance: "var(--chart-3)",
  balance: "var(--chart-4)",
  global: "var(--chart-5)",
};

const AUTO_ROTATE_LABELS: Record<AutoRotateInterval, string> = {
  off: "Off",
  "30": "Every 30 seconds",
  "60": "Every 1 minute",
  "120": "Every 2 minutes",
  "300": "Every 5 minutes",
};

export function QuotesPage() {
  const {
    currentQuote,
    category,
    autoRotate,
    favoriteQuotes,
    nextQuote,
    prevQuote,
    toggleFavorite,
    isFavorite,
    setCategory,
    setAutoRotate,
    filteredCount,
  } = useQuotes();

  const catColor = CATEGORY_COLORS[currentQuote.category] ?? "var(--primary)";

  const currentIndex = QUOTES.filter(
    (q) => category === "all" || q.category === category,
  ).findIndex((q) => q.id === currentQuote.id);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 md:p-6 max-w-3xl mx-auto space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "oklch(var(--primary) / 0.12)",
              border: "1px solid oklch(var(--primary) / 0.25)",
            }}
          >
            <Sparkles
              className="w-5 h-5"
              style={{ color: "oklch(var(--primary))" }}
            />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Daily Quotes
            </h2>
            <p className="text-sm text-muted-foreground font-heading">
              Wisdom from around the world to fuel your CA journey
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="discover" className="w-full">
        <TabsList
          className="w-full h-11 font-heading"
          style={{
            background: "oklch(var(--muted))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <TabsTrigger
            value="discover"
            className="flex-1 text-sm"
            data-ocid="quotes.discover.tab"
          >
            Discover
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="flex-1 text-sm"
            data-ocid="quotes.favorites.tab"
          >
            Favorites
            {favoriteQuotes.length > 0 && (
              <span
                className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: "oklch(var(--primary) / 0.15)",
                  color: "oklch(var(--primary))",
                }}
              >
                {favoriteQuotes.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── DISCOVER TAB ────────────────────────────────────── */}
        <TabsContent value="discover" className="space-y-5 mt-5">
          {/* Category Filter Chips */}
          <motion.div variants={itemVariants}>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {ALL_CATEGORIES.map((cat, i) => {
                const isActive = category === cat;
                const color =
                  cat === "all"
                    ? "var(--primary)"
                    : (CATEGORY_COLORS[cat] ?? "var(--primary)");
                return (
                  <button
                    type="button"
                    key={cat}
                    data-ocid={`quotes.category.filter.${i + 1}`}
                    onClick={() => setCategory(cat)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-heading font-semibold transition-all whitespace-nowrap"
                    style={{
                      background: isActive
                        ? `oklch(${color} / 0.18)`
                        : "oklch(var(--muted))",
                      color: isActive
                        ? `oklch(${color})`
                        : "oklch(var(--muted-foreground))",
                      border: isActive
                        ? `1.5px solid oklch(${color} / 0.45)`
                        : "1.5px solid oklch(var(--border))",
                    }}
                  >
                    {cat === "all"
                      ? "All Quotes"
                      : CATEGORY_LABELS[cat as QuoteCategory]}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Main Quote Display Card */}
          <motion.div variants={itemVariants}>
            <div
              className="relative rounded-2xl p-7 overflow-hidden"
              style={{
                background:
                  "linear-gradient(145deg, oklch(var(--card)), oklch(var(--accent) / 0.2))",
                border: "1px solid oklch(var(--border))",
                boxShadow:
                  "0 8px 40px oklch(var(--primary) / 0.06), 0 2px 8px oklch(var(--foreground) / 0.04)",
              }}
            >
              {/* Decorative orb */}
              <div
                className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-[0.04] pointer-events-none"
                style={{
                  background: `radial-gradient(circle, oklch(${catColor}), transparent)`,
                  transform: "translate(30%, -30%)",
                }}
              />

              {/* Category badge + auto-rotate indicator */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <Badge
                  className="font-heading text-xs px-3 py-1"
                  style={{
                    background: `oklch(${catColor} / 0.14)`,
                    color: `oklch(${catColor})`,
                    border: `1px solid oklch(${catColor} / 0.3)`,
                  }}
                >
                  {CATEGORY_LABELS[currentQuote.category]}
                </Badge>
                {autoRotate !== "off" && (
                  <div className="flex items-center gap-1.5">
                    <RefreshCw
                      className="w-3.5 h-3.5 animate-spin text-muted-foreground"
                      style={{ animationDuration: "3s" }}
                    />
                    <span className="text-xs font-heading text-muted-foreground">
                      Auto-rotating
                    </span>
                  </div>
                )}
              </div>

              {/* Quote text */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuote.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative z-10"
                >
                  <blockquote
                    className="font-display text-xl md:text-2xl italic leading-relaxed mb-6"
                    style={{ color: "oklch(var(--foreground))" }}
                  >
                    <span
                      className="text-5xl font-display leading-none opacity-20 mr-1 align-top"
                      style={{ color: `oklch(${catColor})` }}
                    >
                      "
                    </span>
                    {currentQuote.text}
                    <span
                      className="text-5xl font-display leading-none opacity-20 ml-1 align-bottom"
                      style={{ color: `oklch(${catColor})` }}
                    >
                      "
                    </span>
                  </blockquote>

                  <div className="flex items-end justify-between">
                    <div>
                      <cite
                        className="not-italic font-heading font-bold text-base"
                        style={{ color: "oklch(var(--foreground))" }}
                      >
                        — {currentQuote.author}
                      </cite>
                      {currentQuote.source && (
                        <p
                          className="text-xs font-heading mt-0.5"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          {currentQuote.source}
                        </p>
                      )}
                    </div>
                    {/* Favorite toggle */}
                    <button
                      type="button"
                      data-ocid="quotes.favorite.toggle.button"
                      onClick={() => toggleFavorite(currentQuote.id)}
                      className="p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95"
                      style={{
                        background: isFavorite(currentQuote.id)
                          ? "oklch(var(--destructive) / 0.12)"
                          : "oklch(var(--muted))",
                        border: isFavorite(currentQuote.id)
                          ? "1px solid oklch(var(--destructive) / 0.3)"
                          : "1px solid oklch(var(--border))",
                      }}
                      aria-label={
                        isFavorite(currentQuote.id)
                          ? "Remove from favorites"
                          : "Save to favorites"
                      }
                    >
                      <Heart
                        className="w-5 h-5"
                        style={{
                          color: isFavorite(currentQuote.id)
                            ? "oklch(var(--destructive))"
                            : "oklch(var(--muted-foreground))",
                          fill: isFavorite(currentQuote.id)
                            ? "oklch(var(--destructive))"
                            : "none",
                        }}
                      />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Navigation Controls */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between"
          >
            <Button
              variant="outline"
              onClick={prevQuote}
              data-ocid="quotes.prev.button"
              className="font-heading gap-2 h-10"
              style={{
                borderColor: "oklch(var(--border))",
                color: "oklch(var(--foreground))",
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <span
              className="text-xs font-heading text-muted-foreground"
              aria-live="polite"
            >
              {currentIndex >= 0 ? currentIndex + 1 : "—"} of {filteredCount}{" "}
              {category === "all" ? "quotes" : "in this category"}
            </span>

            <Button
              onClick={nextQuote}
              data-ocid="quotes.next.button"
              className="font-heading gap-2 h-10"
              style={{
                background: "oklch(var(--primary))",
                color: "oklch(var(--primary-foreground))",
              }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Settings Panel */}
          <motion.div variants={itemVariants}>
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{
                background: "oklch(var(--card))",
                border: "1px solid oklch(var(--border))",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Settings2
                  className="w-4 h-4"
                  style={{ color: "oklch(var(--primary))" }}
                />
                <h3 className="text-sm font-heading font-semibold text-foreground">
                  Quote Settings
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-heading text-muted-foreground uppercase tracking-wide block">
                    Auto-rotate Interval
                  </span>
                  <Select
                    value={autoRotate}
                    onValueChange={(v) =>
                      setAutoRotate(v as AutoRotateInterval)
                    }
                  >
                    <SelectTrigger
                      className="h-10 font-heading text-sm"
                      data-ocid="quotes.auto_rotate.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(AUTO_ROTATE_LABELS) as AutoRotateInterval[]
                      ).map((k) => (
                        <SelectItem
                          key={k}
                          value={k}
                          className="font-heading text-sm"
                        >
                          {AUTO_ROTATE_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-heading text-muted-foreground uppercase tracking-wide block">
                    Default Category
                  </span>
                  <Select
                    value={category}
                    onValueChange={(v) =>
                      setCategory(v as QuoteCategory | "all")
                    }
                  >
                    <SelectTrigger
                      className="h-10 font-heading text-sm"
                      data-ocid="quotes.default_category.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-heading text-sm">
                        All Quotes
                      </SelectItem>
                      {(Object.keys(CATEGORY_LABELS) as QuoteCategory[]).map(
                        (k) => (
                          <SelectItem
                            key={k}
                            value={k}
                            className="font-heading text-sm"
                          >
                            {CATEGORY_LABELS[k]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ── FAVORITES TAB ────────────────────────────────────── */}
        <TabsContent value="favorites" className="space-y-4 mt-5">
          {favoriteQuotes.length === 0 ? (
            <motion.div
              variants={itemVariants}
              data-ocid="quotes.favorites.empty_state"
              className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
              style={{
                background: "oklch(var(--card))",
                border: "1px dashed oklch(var(--border))",
              }}
            >
              <Heart
                className="w-12 h-12 mb-4"
                style={{ color: "oklch(var(--muted-foreground))" }}
              />
              <h3 className="font-heading font-semibold text-foreground text-base mb-1">
                No favorites yet
              </h3>
              <p className="text-sm text-muted-foreground font-heading max-w-xs">
                Tap the heart icon on any quote in the Discover tab to save it
                here.
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4"
            >
              {favoriteQuotes.map((q, i) => {
                const color = CATEGORY_COLORS[q.category] ?? "var(--primary)";
                return (
                  <motion.div
                    key={q.id}
                    variants={itemVariants}
                    data-ocid={`quotes.favorite.item.${i + 1}`}
                    className="rounded-2xl p-5 relative"
                    style={{
                      background: "oklch(var(--card))",
                      border: "1px solid oklch(var(--border))",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Badge
                          className="mb-3 text-xs font-heading"
                          style={{
                            background: `oklch(${color} / 0.12)`,
                            color: `oklch(${color})`,
                            border: `1px solid oklch(${color} / 0.25)`,
                          }}
                        >
                          {CATEGORY_LABELS[q.category]}
                        </Badge>
                        <blockquote
                          className="font-display text-sm italic leading-relaxed mb-3"
                          style={{ color: "oklch(var(--foreground))" }}
                        >
                          &ldquo;{q.text}&rdquo;
                        </blockquote>
                        <cite
                          className="not-italic text-xs font-heading font-semibold"
                          style={{ color: "oklch(var(--primary))" }}
                        >
                          — {q.author}
                        </cite>
                        {q.source && (
                          <span
                            className="text-xs font-heading ml-1"
                            style={{ color: "oklch(var(--muted-foreground))" }}
                          >
                            · {q.source}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(q.id)}
                        className="p-2 rounded-xl flex-shrink-0 transition-all hover:scale-110"
                        style={{
                          background: "oklch(var(--destructive) / 0.1)",
                          border: "1px solid oklch(var(--destructive) / 0.25)",
                        }}
                        aria-label="Remove from favorites"
                      >
                        <Heart
                          className="w-4 h-4"
                          style={{
                            color: "oklch(var(--destructive))",
                            fill: "oklch(var(--destructive))",
                          }}
                        />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
