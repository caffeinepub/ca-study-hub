import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { CA_Level } from "../backend.d";
import {
  CA_SUBJECTS,
  LEVEL_LABELS,
  getSubjectsByLevel,
} from "../data/subjects";
import {
  useChapterProgress,
  useStudySessions,
  useUpdateChapterProgress,
} from "../hooks/useQueries";
import { nanoid } from "../utils/nanoid";

export function ProgressPage() {
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Progress Tracker
          </h2>
          <p className="text-sm text-muted-foreground font-heading mt-0.5">
            Track chapters completed and study hours per subject
          </p>
        </div>

        <Tabs defaultValue="intermediate">
          <TabsList
            className="grid grid-cols-3 w-full max-w-md h-10"
            style={{ background: "oklch(var(--muted) / 0.5)" }}
          >
            <TabsTrigger
              value="foundation"
              className="font-heading text-sm"
              data-ocid="progress.foundation.tab"
            >
              Foundation
            </TabsTrigger>
            <TabsTrigger
              value="intermediate"
              className="font-heading text-sm"
              data-ocid="progress.intermediate.tab"
            >
              Inter
            </TabsTrigger>
            <TabsTrigger
              value="final_"
              className="font-heading text-sm"
              data-ocid="progress.final.tab"
            >
              Final
            </TabsTrigger>
          </TabsList>

          {Object.values(CA_Level).map((level) => (
            <TabsContent key={level} value={level} className="mt-4 space-y-3">
              <LevelProgress level={level} />
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  );
}

function LevelProgress({ level }: { level: CA_Level }) {
  const { data: allProgress = [], isLoading: progressLoading } =
    useChapterProgress();
  const { data: studySessions = [] } = useStudySessions();
  const updateChapter = useUpdateChapterProgress();
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set());

  const subjects = getSubjectsByLevel(level);

  const toggleSubject = (code: string) => {
    setOpenSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleChapterToggle = async (
    subjectName: string,
    chapterName: string,
    currentCompleted: boolean,
  ) => {
    // Find existing or create chapterId
    const existing = allProgress.find(
      (p) =>
        p.subject === subjectName &&
        p.chapterId.includes(chapterName.replace(/\s/g, "_").slice(0, 30)),
    );
    const chapterId =
      existing?.chapterId ||
      `${subjectName.replace(/\s/g, "_").slice(0, 20)}_${chapterName.replace(/\s/g, "_").slice(0, 30)}_${nanoid()}`;

    try {
      await updateChapter.mutateAsync({
        chapterId,
        subject: subjectName,
        caLevel: level,
        completed: !currentCompleted,
      });
    } catch {
      toast.error("Failed to update chapter");
    }
  };

  // Compute study hours per subject
  const hoursPerSubject = studySessions.reduce<Record<string, number>>(
    (acc, s) => {
      if (s.caLevel === level) {
        acc[s.subject] = (acc[s.subject] || 0) + Number(s.durationMins);
      }
      return acc;
    },
    {},
  );

  if (progressLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  // Overall level stats
  const totalChapters = subjects.reduce((acc, s) => acc + s.chapters.length, 0);
  const completedInLevel = allProgress.filter(
    (p) => p.caLevel === level && p.completed,
  ).length;
  const levelPercent =
    totalChapters > 0
      ? Math.round((completedInLevel / totalChapters) * 100)
      : 0;
  const totalHours = Object.values(hoursPerSubject).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Level Overview Card */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
            <BarChart2
              className="w-4 h-4"
              style={{ color: "oklch(var(--primary))" }}
            />
            CA {LEVEL_LABELS[level]} Overview
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-heading text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {(totalHours / 60).toFixed(1)}h studied
            </div>
            <Badge
              className="font-heading text-xs"
              style={{
                background: "oklch(var(--primary) / 0.15)",
                color: "oklch(var(--primary))",
                border: "1px solid oklch(var(--primary) / 0.3)",
              }}
            >
              {levelPercent}% done
            </Badge>
          </div>
        </div>
        <Progress
          value={levelPercent}
          className="h-2.5"
          style={{
            background: "oklch(var(--muted))",
          }}
        />
        <p className="text-xs text-muted-foreground font-heading mt-1.5">
          {completedInLevel} of {totalChapters} chapters completed
        </p>
      </div>

      {/* Subject List */}
      {subjects.map((subject, sIdx) => {
        const subjectProgress = allProgress.filter(
          (p) => p.subject === subject.name && p.caLevel === level,
        );
        const completedChapters = subjectProgress.filter(
          (p) => p.completed,
        ).length;
        const totalChaps = subject.chapters.length;
        const percent =
          totalChaps > 0
            ? Math.round((completedChapters / totalChaps) * 100)
            : 0;
        const studyMinutes = hoursPerSubject[subject.name] || 0;
        const isOpen = openSubjects.has(subject.code);

        return (
          <motion.div
            key={subject.code}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.05 }}
          >
            <Collapsible
              open={isOpen}
              onOpenChange={() => toggleSubject(subject.code)}
            >
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  background: "oklch(var(--card))",
                  border: "1px solid oklch(var(--border))",
                }}
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="text-xs font-heading font-bold"
                          style={{ color: "oklch(var(--primary))" }}
                        >
                          {subject.code}
                        </span>
                        <span className="text-sm font-heading font-semibold text-foreground truncate">
                          {subject.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-heading">
                          <BookOpen className="w-3 h-3" />
                          {completedChapters}/{totalChaps} chapters
                        </div>
                        {studyMinutes > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-heading">
                            <Clock className="w-3 h-3" />
                            {(studyMinutes / 60).toFixed(1)}h
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={percent} className="flex-1 h-1.5" />
                        <span
                          className="text-xs font-bold font-heading flex-shrink-0"
                          style={{ color: "oklch(var(--primary))" }}
                        >
                          {percent}%
                        </span>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    )}
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div
                    className="px-4 pb-4 pt-1 space-y-2"
                    style={{ borderTop: "1px solid oklch(var(--border))" }}
                  >
                    {subject.chapters.map((chapter, cIdx) => {
                      // Find if this chapter is completed
                      const chapterKey = `${subject.name.replace(/\s/g, "_").slice(0, 20)}_${chapter.replace(/\s/g, "_").slice(0, 30)}`;
                      const progressEntry = subjectProgress.find((p) =>
                        p.chapterId.includes(chapterKey),
                      );
                      const isCompleted = progressEntry?.completed ?? false;

                      return (
                        <div
                          key={chapter}
                          className="flex items-start gap-3 py-1.5 px-2 rounded-lg transition-colors hover:bg-muted/30"
                        >
                          <Checkbox
                            id={`${subject.code}-${cIdx}`}
                            checked={isCompleted}
                            onCheckedChange={() =>
                              handleChapterToggle(
                                subject.name,
                                chapter,
                                isCompleted,
                              )
                            }
                            className="mt-0.5"
                            data-ocid={
                              cIdx === 0
                                ? "progress.chapter.checkbox.1"
                                : undefined
                            }
                            style={{
                              borderColor: isCompleted
                                ? "oklch(var(--primary))"
                                : "oklch(var(--border))",
                            }}
                          />
                          <label
                            htmlFor={`${subject.code}-${cIdx}`}
                            className="text-sm font-heading cursor-pointer leading-relaxed"
                            style={{
                              color: isCompleted
                                ? "oklch(var(--muted-foreground))"
                                : "oklch(var(--foreground))",
                              textDecoration: isCompleted
                                ? "line-through"
                                : "none",
                            }}
                          >
                            {chapter}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </motion.div>
        );
      })}
    </div>
  );
}
