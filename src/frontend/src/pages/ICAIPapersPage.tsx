import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookMarked,
  ExternalLink,
  FileText,
  GraduationCap,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  ALL_CATEGORIES,
  type CALevel,
  CATEGORY_COLORS,
  type ICAIPaper,
  ICAI_PAPERS,
  LEVEL_LABELS,
  type PaperCategory,
} from "../data/icaiPapers";

interface ViewerState {
  paper: ICAIPaper;
  embedFailed: boolean;
}

function PaperCard({
  paper,
  index,
  onView,
}: {
  paper: ICAIPaper;
  index: number;
  onView: (p: ICAIPaper) => void;
}) {
  const catColor = CATEGORY_COLORS[paper.category];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-xl p-4 flex flex-col gap-3 group"
      style={{
        background: "oklch(var(--card))",
        border: "1px solid oklch(var(--border))",
      }}
      data-ocid={`icai.paper.item.${index + 1}`}
    >
      {/* Icon + Title */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `oklch(${catColor} / 0.1)`,
            border: `1px solid oklch(${catColor} / 0.25)`,
          }}
        >
          <FileText
            className="w-5 h-5"
            style={{ color: `oklch(${catColor})` }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading font-semibold text-foreground leading-snug">
            {paper.title}
          </p>
          <p className="text-xs text-muted-foreground font-heading mt-0.5">
            {paper.subject}
            {paper.year ? ` · ${paper.year}` : ""}
          </p>
        </div>
      </div>

      {/* Badge */}
      <div>
        <Badge
          className="text-xs font-heading"
          style={{
            background: `oklch(${catColor} / 0.1)`,
            color: `oklch(${catColor})`,
            border: `1px solid oklch(${catColor} / 0.25)`,
          }}
        >
          {paper.category}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onView(paper)}
          className="flex-1 h-8 text-xs font-heading gap-1.5"
          data-ocid={`icai.paper.view_button.${index + 1}`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          View
        </Button>
        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          data-ocid={`icai.paper.open_button.${index + 1}`}
        >
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            style={{
              color: "oklch(var(--primary))",
              borderColor: "oklch(var(--primary) / 0.3)",
            }}
            title="Open on ICAI website"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </a>
      </div>
    </motion.div>
  );
}

function LevelContent({
  level,
  activeCategory,
}: {
  level: CALevel;
  activeCategory: PaperCategory | "all";
}) {
  const [viewer, setViewer] = useState<ViewerState | null>(null);

  const papers = ICAI_PAPERS.filter(
    (p) =>
      p.level === level &&
      (activeCategory === "all" || p.category === activeCategory),
  );

  return (
    <>
      {papers.length === 0 ? (
        <div
          className="text-center py-14 rounded-xl"
          style={{
            background: "oklch(var(--card))",
            border: "1px dashed oklch(var(--border))",
          }}
          data-ocid="icai.papers.empty_state"
        >
          <GraduationCap
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "oklch(var(--muted-foreground))" }}
          />
          <p className="text-base font-heading font-semibold text-foreground">
            No papers found
          </p>
          <p className="text-sm text-muted-foreground font-heading mt-1">
            Try selecting a different category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {papers.map((paper, i) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              index={i}
              onView={(p) => setViewer({ paper: p, embedFailed: false })}
            />
          ))}
        </div>
      )}

      {/* Inline Viewer Modal */}
      <AnimatePresence>
        {viewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: "oklch(0 0 0 / 0.88)" }}
            data-ocid="icai.viewer.modal"
          >
            {/* Toolbar */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                background: "oklch(var(--card))",
                borderBottom: "1px solid oklch(var(--border))",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: "oklch(var(--primary))" }}
                />
                <h3 className="font-heading font-semibold text-foreground truncate max-w-xs md:max-w-lg">
                  {viewer.paper.title}
                </h3>
                <Badge
                  className="text-xs font-heading hidden sm:inline-flex"
                  style={{
                    background: `oklch(${CATEGORY_COLORS[viewer.paper.category]} / 0.1)`,
                    color: `oklch(${CATEGORY_COLORS[viewer.paper.category]})`,
                    border: `1px solid oklch(${CATEGORY_COLORS[viewer.paper.category]} / 0.25)`,
                  }}
                >
                  {viewer.paper.category}
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <a
                  href={viewer.paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid="icai.viewer.open_button"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-heading gap-1.5 hidden sm:flex"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open on ICAI
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewer(null)}
                  className="w-9 h-9"
                  data-ocid="icai.viewer.close_button"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Viewer */}
            <div className="flex-1 overflow-hidden relative">
              {viewer.embedFailed ? (
                // Fallback when embed is blocked
                <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "oklch(var(--primary) / 0.1)",
                      border: "1px solid oklch(var(--primary) / 0.25)",
                    }}
                  >
                    <ExternalLink
                      className="w-8 h-8"
                      style={{ color: "oklch(var(--primary))" }}
                    />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-foreground text-base">
                      This document cannot be previewed here
                    </p>
                    <p className="text-sm text-muted-foreground font-heading mt-1 max-w-sm">
                      The ICAI website restricts embedding for this file. Open
                      it directly on the ICAI website to view or download.
                    </p>
                  </div>
                  <a
                    href={viewer.paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="icai.viewer.fallback.open_button"
                  >
                    <Button
                      className="font-heading gap-2"
                      style={{
                        background: "oklch(var(--primary))",
                        color: "oklch(var(--primary-foreground))",
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open on ICAI Website
                    </Button>
                  </a>
                </div>
              ) : (
                <iframe
                  key={viewer.paper.url}
                  src={viewer.paper.url}
                  title={viewer.paper.title}
                  className="w-full h-full border-0"
                  style={{ background: "white" }}
                  onError={() =>
                    setViewer((v) => v && { ...v, embedFailed: true })
                  }
                  // Most ICAI pages block X-Frame-Options; show fallback after 8s
                  onLoad={(e) => {
                    // Check if iframe loaded a blank/error page
                    try {
                      const doc = (e.target as HTMLIFrameElement)
                        .contentDocument;
                      if (doc?.body && doc.body.innerHTML === "") {
                        setViewer((v) => v && { ...v, embedFailed: true });
                      }
                    } catch {
                      // cross-origin – can't read, assume loaded OK
                    }
                  }}
                />
              )}
            </div>

            {/* Mobile "Open on ICAI" bar */}
            <div
              className="sm:hidden flex items-center justify-center p-3 border-t flex-shrink-0"
              style={{
                background: "oklch(var(--card))",
                borderColor: "oklch(var(--border))",
              }}
            >
              <a
                href={viewer.paper.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-heading gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open on ICAI Website
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function ICAIPapersPage() {
  const [activeCategory, setActiveCategory] = useState<PaperCategory | "all">(
    "all",
  );

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "oklch(var(--primary) / 0.1)",
                border: "1px solid oklch(var(--primary) / 0.25)",
              }}
            >
              <GraduationCap
                className="w-5 h-5"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                ICAI Study Papers
              </h2>
              <p className="text-sm text-muted-foreground font-heading mt-0.5">
                Official ICAI study material, question papers, RTPs & MTPs
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2" data-ocid="icai.category.filter">
          {(["all", ...ALL_CATEGORIES] as const).map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-heading font-medium transition-all border"
                style={
                  isActive
                    ? {
                        background: "oklch(var(--primary))",
                        color: "oklch(var(--primary-foreground))",
                        borderColor: "oklch(var(--primary))",
                      }
                    : {
                        background: "oklch(var(--card))",
                        color: "oklch(var(--muted-foreground))",
                        borderColor: "oklch(var(--border))",
                      }
                }
                data-ocid={`icai.category.${cat === "all" ? "all" : cat.toLowerCase().replace(/\s+/g, "_")}.toggle`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            );
          })}
        </div>

        {/* Level Tabs */}
        <Tabs defaultValue="intermediate" className="w-full">
          <TabsList className="font-heading" data-ocid="icai.level.tab">
            {(["foundation", "intermediate", "final"] as CALevel[]).map(
              (level) => (
                <TabsTrigger
                  key={level}
                  value={level}
                  className="text-xs sm:text-sm"
                >
                  {LEVEL_LABELS[level]}
                </TabsTrigger>
              ),
            )}
          </TabsList>

          {(["foundation", "intermediate", "final"] as CALevel[]).map(
            (level) => (
              <TabsContent key={level} value={level} className="mt-5">
                <LevelContent level={level} activeCategory={activeCategory} />
              </TabsContent>
            ),
          )}
        </Tabs>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground font-heading text-center pb-2">
          All materials sourced from{" "}
          <a
            href="https://icai.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "oklch(var(--primary))" }}
          >
            icai.org
          </a>
          . Some documents may open on the ICAI website if embedding is
          restricted.
        </p>
      </motion.div>
    </div>
  );
}
