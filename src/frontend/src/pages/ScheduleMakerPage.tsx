import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Brain,
  CalendarClock,
  Check,
  Copy,
  GripVertical,
  PenLine,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { CA_Level } from "../backend.d";
import { CA_SUBJECTS, LEVEL_LABELS } from "../data/subjects";
import {
  type ScheduleBlock,
  type ScheduleInput,
  generateSchedule,
  scheduleToText,
} from "../utils/scheduleGenerator";

// ─── Constants ──────────────────────────────────────────────────────────────

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
type Day = (typeof DAYS)[number];

const DURATIONS = [
  { label: "30 min", value: 0.5 },
  { label: "1 hr", value: 1 },
  { label: "1.5 hr", value: 1.5 },
  { label: "2 hr", value: 2 },
  { label: "3 hr", value: 3 },
];

const TIME_PREFS = [
  { id: "morning" as const, label: "Morning", sub: "6am–12pm", emoji: "🌅" },
  {
    id: "afternoon" as const,
    label: "Afternoon",
    sub: "12pm–6pm",
    emoji: "☀️",
  },
  { id: "evening" as const, label: "Evening", sub: "6pm–10pm", emoji: "🌇" },
  { id: "night" as const, label: "Night", sub: "10pm–2am", emoji: "🌙" },
];

const GRID_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

function slotKey(day: Day, hour: number): string {
  return `${day}__${hour}`;
}

const SUBJECT_COLORS = [
  "oklch(var(--primary) / 0.85)",
  "oklch(var(--chart-1) / 0.85)",
  "oklch(var(--chart-2) / 0.85)",
  "oklch(var(--chart-3) / 0.85)",
  "oklch(var(--chart-4) / 0.85)",
  "oklch(var(--chart-5) / 0.85)",
  "oklch(0.65 0.15 200 / 0.85)",
  "oklch(0.65 0.15 280 / 0.85)",
];

// ─── Manual Block type ───────────────────────────────────────────────────────

interface ManualBlock {
  id: string;
  subject: string;
  level: CA_Level;
  day: Day;
  startTime: string;
  duration: number;
}

interface DndSlot {
  hour: number;
  day: Day;
  subject: string | null;
  colorIdx: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

function subjectColorIdx(name: string, subjects: string[]): number {
  const idx = subjects.indexOf(name);
  return idx >= 0 ? idx % SUBJECT_COLORS.length : 0;
}

// ─── AI Generator Tab ────────────────────────────────────────────────────────

function AIGeneratorTab() {
  const [level, setLevel] = useState<CA_Level>(CA_Level.intermediate);
  const [examDate, setExamDate] = useState<string>("");
  const [dailyHours, setDailyHours] = useState<number>(6);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [timePref, setTimePref] =
    useState<ScheduleInput["preferredTime"]>("morning");
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [activeWeek, setActiveWeek] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const subjects = CA_SUBJECTS.filter((s) => s.level === level);
  const weeks = schedule.length
    ? [...new Set(schedule.map((b) => b.week))].sort()
    : [];

  const toggleWeak = (name: string) => {
    setWeakSubjects((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };

  const handleGenerate = () => {
    if (!examDate) {
      toast.error("Please select an exam date");
      return;
    }
    setGenerating(true);
    // Simulate brief "thinking" for UX
    setTimeout(() => {
      const result = generateSchedule({
        level,
        examDate: new Date(examDate),
        dailyHours,
        weakSubjects,
        preferredTime: timePref,
      });
      setSchedule(result);
      setActiveWeek(1);
      setGenerating(false);
      toast.success("Schedule generated! Review below.");
    }, 600);
  };

  const handleCopy = async () => {
    const text = scheduleToText(schedule, level);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Schedule copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const daysRemaining = examDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Form */}
      <div
        className="rounded-2xl p-5 space-y-5"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Brain
            className="w-5 h-5"
            style={{ color: "oklch(var(--primary))" }}
          />
          <h3 className="font-display text-base font-bold text-foreground">
            Tell me about your exam
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CA Level */}
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
              CA Level
            </Label>
            <Select
              value={level}
              onValueChange={(v) => {
                setLevel(v as CA_Level);
                setWeakSubjects([]);
              }}
            >
              <SelectTrigger
                className="h-10 font-heading text-sm"
                data-ocid="schedule.ai.level.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CA_Level).map((l) => (
                  <SelectItem
                    key={l}
                    value={l}
                    className="font-heading text-sm"
                  >
                    {LEVEL_LABELS[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exam Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
              Exam Date
              {daysRemaining !== null && (
                <span
                  className="ml-2 font-bold"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  {daysRemaining}d remaining
                </span>
              )}
            </Label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full h-10 px-3 rounded-md border font-heading text-sm bg-transparent text-foreground"
              style={{
                borderColor: "oklch(var(--border))",
                background: "oklch(var(--input) / 0.5)",
              }}
              data-ocid="schedule.ai.exam_date.input"
            />
          </div>
        </div>

        {/* Daily Hours */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
              Daily Study Hours
            </Label>
            <span
              className="text-lg font-display font-bold"
              style={{ color: "oklch(var(--primary))" }}
            >
              {dailyHours}h
            </span>
          </div>
          <Slider
            min={1}
            max={12}
            step={0.5}
            value={[dailyHours]}
            onValueChange={([v]) => setDailyHours(v)}
            className="w-full"
            data-ocid="schedule.ai.hours.input"
          />
          <div className="flex justify-between text-[10px] font-heading text-muted-foreground">
            <span>1h (Light)</span>
            <span>6h (Standard)</span>
            <span>12h (Intensive)</span>
          </div>
        </div>

        {/* Preferred Time */}
        <div className="space-y-2">
          <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
            Preferred Study Time
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIME_PREFS.map((tp) => (
              <button
                key={tp.id}
                type="button"
                onClick={() => setTimePref(tp.id)}
                data-ocid="schedule.ai.time_pref.toggle"
                className="flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl border text-center transition-all"
                style={{
                  background:
                    timePref === tp.id
                      ? "oklch(var(--primary) / 0.12)"
                      : "oklch(var(--muted) / 0.3)",
                  borderColor:
                    timePref === tp.id
                      ? "oklch(var(--primary) / 0.5)"
                      : "oklch(var(--border))",
                  color:
                    timePref === tp.id
                      ? "oklch(var(--primary))"
                      : "oklch(var(--muted-foreground))",
                }}
              >
                <span className="text-xl">{tp.emoji}</span>
                <span className="text-xs font-heading font-semibold">
                  {tp.label}
                </span>
                <span className="text-[10px] font-heading opacity-70">
                  {tp.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Weak Subjects */}
        <div className="space-y-2">
          <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
            Weak Subjects{" "}
            <span className="normal-case">(get 1.5x more study time)</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {subjects.map((s, i) => (
              <label
                key={s.code}
                htmlFor={`weak-${s.code}`}
                className="flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors"
                style={{
                  background: weakSubjects.includes(s.name)
                    ? "oklch(var(--primary) / 0.08)"
                    : "oklch(var(--muted) / 0.2)",
                  border: weakSubjects.includes(s.name)
                    ? "1px solid oklch(var(--primary) / 0.3)"
                    : "1px solid transparent",
                }}
              >
                <Checkbox
                  id={`weak-${s.code}`}
                  checked={weakSubjects.includes(s.name)}
                  onCheckedChange={() => toggleWeak(s.name)}
                  data-ocid={`schedule.ai.weak.checkbox.${i + 1}`}
                />
                <span className="text-xs font-heading text-foreground leading-tight">
                  {s.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating || !examDate}
          className="w-full h-11 font-heading font-semibold text-sm gap-2"
          style={{
            background: "oklch(var(--primary))",
            color: "oklch(var(--primary-foreground))",
          }}
          data-ocid="schedule.ai.generate.primary_button"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Generating your schedule...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate My Schedule
            </>
          )}
        </Button>
      </div>

      {/* Generated Schedule */}
      <AnimatePresence>
        {schedule.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Your Personalized Schedule
                </h3>
                <p className="text-xs text-muted-foreground font-heading mt-0.5">
                  {schedule.length} blocks across {weeks.length} week
                  {weeks.length > 1 ? "s" : ""}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="font-heading text-xs gap-1.5"
                data-ocid="schedule.ai.copy.button"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied!" : "Copy as Text"}
              </Button>
            </div>

            {/* Week Tabs */}
            <Tabs
              value={String(activeWeek)}
              onValueChange={(v) => setActiveWeek(Number(v))}
            >
              <TabsList className="h-9 font-heading">
                {weeks.map((w) => (
                  <TabsTrigger
                    key={w}
                    value={String(w)}
                    className="text-xs px-3"
                  >
                    Week {w}
                  </TabsTrigger>
                ))}
              </TabsList>

              {weeks.map((week) => {
                const weekBlocks = schedule.filter((b) => b.week === week);
                return (
                  <TabsContent key={week} value={String(week)} className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {DAYS.map((day) => {
                        const dayBlocks = weekBlocks.filter(
                          (b) => b.day === day,
                        );
                        return (
                          <motion.div
                            key={day}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: DAYS.indexOf(day) * 0.04,
                              duration: 0.2,
                            }}
                            className="rounded-xl overflow-hidden"
                            style={{
                              background: "oklch(var(--card))",
                              border: "1px solid oklch(var(--border))",
                            }}
                          >
                            <div
                              className="px-3 py-2"
                              style={{
                                background:
                                  day === "Sunday"
                                    ? "oklch(var(--primary) / 0.08)"
                                    : "oklch(var(--muted) / 0.35)",
                                borderBottom: "1px solid oklch(var(--border))",
                              }}
                            >
                              <span
                                className="text-xs font-heading font-bold uppercase tracking-wider"
                                style={{
                                  color:
                                    day === "Sunday"
                                      ? "oklch(var(--primary))"
                                      : "oklch(var(--foreground))",
                                }}
                              >
                                {day}
                              </span>
                            </div>

                            <div className="p-2 space-y-1.5">
                              {dayBlocks.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground font-heading text-center py-3">
                                  Rest day
                                </p>
                              ) : (
                                dayBlocks.map((block, bi) => (
                                  <div
                                    key={`${block.day}-${block.week}-${block.time}-${bi}`}
                                    className="p-2 rounded-lg"
                                    style={{
                                      background: block.isRevision
                                        ? "oklch(var(--chart-4) / 0.12)"
                                        : block.isWeak
                                          ? "oklch(var(--destructive) / 0.08)"
                                          : "oklch(var(--primary) / 0.06)",
                                      border: block.isRevision
                                        ? "1px solid oklch(var(--chart-4) / 0.3)"
                                        : block.isWeak
                                          ? "1px solid oklch(var(--destructive) / 0.25)"
                                          : "1px solid oklch(var(--primary) / 0.15)",
                                    }}
                                  >
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                      <span
                                        className="text-[10px] font-heading font-bold"
                                        style={{
                                          color: block.isRevision
                                            ? "oklch(var(--chart-4))"
                                            : block.isWeak
                                              ? "oklch(var(--destructive))"
                                              : "oklch(var(--primary))",
                                        }}
                                      >
                                        {block.time}–{block.endTime}
                                      </span>
                                      <span className="text-[10px] font-heading text-muted-foreground">
                                        {block.durationHrs}h
                                      </span>
                                    </div>
                                    <p className="text-xs font-heading text-foreground leading-tight line-clamp-2">
                                      {block.subject}
                                    </p>
                                    {(block.isRevision || block.isWeak) && (
                                      <div className="flex gap-1 mt-1">
                                        {block.isRevision && (
                                          <Badge
                                            className="text-[9px] px-1.5 py-0 h-4 font-heading"
                                            style={{
                                              background:
                                                "oklch(var(--chart-4) / 0.2)",
                                              color: "oklch(var(--chart-4))",
                                              border: "none",
                                            }}
                                          >
                                            Revision
                                          </Badge>
                                        )}
                                        {block.isWeak && (
                                          <Badge
                                            className="text-[9px] px-1.5 py-0 h-4 font-heading"
                                            style={{
                                              background:
                                                "oklch(var(--destructive) / 0.15)",
                                              color:
                                                "oklch(var(--destructive))",
                                              border: "none",
                                            }}
                                          >
                                            Focus
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pt-1">
              {[
                {
                  label: "Regular",
                  bg: "oklch(var(--primary) / 0.1)",
                  color: "oklch(var(--primary))",
                },
                {
                  label: "Focus (Weak)",
                  bg: "oklch(var(--destructive) / 0.1)",
                  color: "oklch(var(--destructive))",
                },
                {
                  label: "Revision Sunday",
                  bg: "oklch(var(--chart-4) / 0.1)",
                  color: "oklch(var(--chart-4))",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 text-xs font-heading"
                >
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{
                      background: item.bg,
                      border: `1px solid ${item.color}`,
                    }}
                  />
                  <span style={{ color: "oklch(var(--muted-foreground))" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Manual Planner – Form Entry ─────────────────────────────────────────────

function FormEntryPlanner() {
  const [formLevel, setFormLevel] = useState<CA_Level>(CA_Level.intermediate);
  const [formSubject, setFormSubject] = useState<string>("");
  const [formDay, setFormDay] = useState<Day>("Monday");
  const [formTime, setFormTime] = useState<string>("09:00");
  const [formDuration, setFormDuration] = useState<number>(1);
  const [blocks, setBlocks] = useState<ManualBlock[]>([]);

  const subjects = CA_SUBJECTS.filter((s) => s.level === formLevel);

  const handleAdd = () => {
    if (!formSubject) {
      toast.error("Please select a subject");
      return;
    }
    const newBlock: ManualBlock = {
      id: `${Date.now()}-${Math.random()}`,
      subject: formSubject,
      level: formLevel,
      day: formDay,
      startTime: formTime,
      duration: formDuration,
    };
    setBlocks((prev) => [...prev, newBlock]);
    toast.success("Block added to your schedule");
  };

  const handleDelete = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const blocksByDay = DAYS.reduce<Record<Day, ManualBlock[]>>(
    (acc, day) => {
      acc[day] = blocks
        .filter((b) => b.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    },
    {} as Record<Day, ManualBlock[]>,
  );

  const allSubjectNames = subjects.map((s) => s.name);

  return (
    <div className="space-y-5">
      {/* Form Card */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
        }}
      >
        <div className="flex items-center gap-2">
          <PenLine
            className="w-4 h-4"
            style={{ color: "oklch(var(--primary))" }}
          />
          <h3 className="font-display text-sm font-bold text-foreground">
            Add a Study Block
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Level */}
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground">
              CA Level
            </Label>
            <Select
              value={formLevel}
              onValueChange={(v) => {
                setFormLevel(v as CA_Level);
                setFormSubject("");
              }}
            >
              <SelectTrigger
                className="h-9 text-sm font-heading"
                data-ocid="schedule.manual.level.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CA_Level).map((l) => (
                  <SelectItem
                    key={l}
                    value={l}
                    className="font-heading text-sm"
                  >
                    {LEVEL_LABELS[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground">
              Subject
            </Label>
            <Select value={formSubject} onValueChange={setFormSubject}>
              <SelectTrigger
                className="h-9 text-sm font-heading"
                data-ocid="schedule.manual.subject.select"
              >
                <SelectValue placeholder="Select subject..." />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem
                    key={s.code}
                    value={s.name}
                    className="font-heading text-sm"
                  >
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day */}
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground">
              Day
            </Label>
            <Select value={formDay} onValueChange={(v) => setFormDay(v as Day)}>
              <SelectTrigger
                className="h-9 text-sm font-heading"
                data-ocid="schedule.manual.day.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem
                    key={d}
                    value={d}
                    className="font-heading text-sm"
                  >
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground">
              Start Time
            </Label>
            <input
              type="time"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              className="w-full h-9 px-3 rounded-md border font-heading text-sm bg-transparent text-foreground"
              style={{
                borderColor: "oklch(var(--border))",
                background: "oklch(var(--input) / 0.5)",
              }}
              data-ocid="schedule.manual.time.input"
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-heading text-muted-foreground">
              Duration
            </Label>
            <div className="flex gap-2 flex-wrap">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setFormDuration(d.value)}
                  data-ocid="schedule.manual.duration.select"
                  className="px-3 py-1.5 rounded-lg text-xs font-heading font-medium transition-all border"
                  style={{
                    background:
                      formDuration === d.value
                        ? "oklch(var(--primary) / 0.12)"
                        : "oklch(var(--muted) / 0.3)",
                    borderColor:
                      formDuration === d.value
                        ? "oklch(var(--primary) / 0.4)"
                        : "oklch(var(--border))",
                    color:
                      formDuration === d.value
                        ? "oklch(var(--primary))"
                        : "oklch(var(--muted-foreground))",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={handleAdd}
          className="w-full sm:w-auto h-9 font-heading text-sm gap-2"
          style={{
            background: "oklch(var(--primary))",
            color: "oklch(var(--primary-foreground))",
          }}
          data-ocid="schedule.manual.add.button"
        >
          <Plus className="w-4 h-4" />
          Add Block
        </Button>
      </div>

      {/* Grid display */}
      {blocks.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "oklch(var(--muted) / 0.3)",
            border: "1px dashed oklch(var(--border))",
          }}
          data-ocid="schedule.manual.empty_state"
        >
          <CalendarClock
            className="w-10 h-10 mx-auto mb-3 opacity-30"
            style={{ color: "oklch(var(--primary))" }}
          />
          <p className="text-sm font-heading text-muted-foreground">
            Add study blocks above to build your weekly schedule
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {DAYS.map((day) => {
            const dayBlocks = blocksByDay[day] || [];
            return (
              <motion.div
                key={day}
                layout
                className="rounded-xl overflow-hidden"
                style={{
                  background: "oklch(var(--card))",
                  border: "1px solid oklch(var(--border))",
                }}
              >
                <div
                  className="px-3 py-2"
                  style={{
                    background: "oklch(var(--muted) / 0.35)",
                    borderBottom: "1px solid oklch(var(--border))",
                  }}
                >
                  <span className="text-xs font-heading font-bold uppercase tracking-wider text-foreground">
                    {day}
                  </span>
                </div>
                <div className="p-2 space-y-1.5 min-h-[60px]">
                  {dayBlocks.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground font-heading text-center py-3">
                      No blocks
                    </p>
                  ) : (
                    dayBlocks.map((block, bi) => {
                      const colorIdx = subjectColorIdx(
                        block.subject,
                        allSubjectNames,
                      );
                      return (
                        <motion.div
                          key={block.id}
                          layout
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          className="group relative flex items-start gap-2 p-2 rounded-lg"
                          style={{
                            background: `${SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length].replace("0.85", "0.1")}`,
                            border: `1px solid ${SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length].replace("0.85", "0.3")}`,
                          }}
                          data-ocid={`schedule.manual.block.item.${bi + 1}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span
                                className="text-[10px] font-heading font-bold"
                                style={{
                                  color:
                                    SUBJECT_COLORS[
                                      colorIdx % SUBJECT_COLORS.length
                                    ],
                                }}
                              >
                                {block.startTime}
                              </span>
                              <span className="text-[10px] font-heading text-muted-foreground">
                                · {block.duration}h
                              </span>
                            </div>
                            <p className="text-xs font-heading text-foreground leading-tight line-clamp-2">
                              {block.subject}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(block.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded flex-shrink-0 mt-0.5"
                            style={{ color: "oklch(var(--destructive))" }}
                            data-ocid={`schedule.manual.block.delete_button.${bi + 1}`}
                            aria-label="Delete block"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Drag & Drop Planner ─────────────────────────────────────────────────────

function DragDropPlanner() {
  const [dndLevel, setDndLevel] = useState<CA_Level>(CA_Level.intermediate);
  const [slots, setSlots] = useState<Record<string, DndSlot>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const dragSubjectRef = useRef<string | null>(null);

  const subjects = CA_SUBJECTS.filter((s) => s.level === dndLevel);
  const subjectNames = subjects.map((s) => s.name);

  const handleDragStart = useCallback((subjectName: string) => {
    dragSubjectRef.current = subjectName;
    setDragging(subjectName);
  }, []);

  const handleDrop = useCallback(
    (day: Day, hour: number) => {
      if (!dragSubjectRef.current) return;
      const key = slotKey(day, hour);
      const subject = dragSubjectRef.current;
      const colorIdx = subjectNames.indexOf(subject) % SUBJECT_COLORS.length;
      setSlots((prev) => ({
        ...prev,
        [key]: {
          hour,
          day,
          subject,
          colorIdx,
        },
      }));
      setDragging(null);
      dragSubjectRef.current = null;
    },
    [subjectNames],
  );

  const handleRemoveSlot = (day: Day, hour: number) => {
    const key = slotKey(day, hour);
    setSlots((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const filledCount = Object.keys(slots).length;

  return (
    <div className="space-y-5">
      {/* Header controls */}
      <div
        className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
        }}
      >
        <div className="flex items-center gap-2">
          <GripVertical
            className="w-4 h-4"
            style={{ color: "oklch(var(--primary))" }}
          />
          <span className="font-display text-sm font-bold text-foreground">
            Drag &amp; Drop Planner
          </span>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Label className="text-xs font-heading text-muted-foreground whitespace-nowrap">
            CA Level:
          </Label>
          <Select
            value={dndLevel}
            onValueChange={(v) => {
              setDndLevel(v as CA_Level);
              setSlots({});
            }}
          >
            <SelectTrigger
              className="h-8 w-[140px] text-xs font-heading"
              data-ocid="schedule.dnd.level.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CA_Level).map((l) => (
                <SelectItem key={l} value={l} className="font-heading text-xs">
                  {LEVEL_LABELS[l]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filledCount > 0 && (
            <Badge
              className="font-heading text-[10px]"
              style={{
                background: "oklch(var(--primary) / 0.12)",
                color: "oklch(var(--primary))",
                border: "none",
              }}
            >
              {filledCount} blocks
            </Badge>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Subject Chips panel */}
        <div
          className="hidden sm:flex flex-col gap-1.5 w-44 flex-shrink-0 rounded-2xl p-3"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <p className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider mb-1">
            Drag subjects
          </p>
          {subjects.map((s, i) => (
            <div
              key={s.code}
              draggable
              onDragStart={() => handleDragStart(s.name)}
              onDragEnd={() => setDragging(null)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-heading font-medium cursor-grab active:cursor-grabbing transition-all select-none line-clamp-2 leading-tight"
              style={{
                background:
                  dragging === s.name
                    ? `${SUBJECT_COLORS[i % SUBJECT_COLORS.length].replace("0.85", "0.25")}`
                    : `${SUBJECT_COLORS[i % SUBJECT_COLORS.length].replace("0.85", "0.12")}`,
                border: `1px solid ${SUBJECT_COLORS[i % SUBJECT_COLORS.length].replace("0.85", "0.35")}`,
                color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
                transform: dragging === s.name ? "scale(0.95)" : "scale(1)",
              }}
              data-ocid={`schedule.dnd.chip.item.${i + 1}`}
            >
              {s.name}
            </div>
          ))}
        </div>

        {/* Mobile chip strip */}
        <div className="flex sm:hidden gap-2 overflow-x-auto pb-2 flex-shrink-0 -mx-1 px-1">
          {subjects.map((s, i) => (
            <div
              key={s.code}
              draggable
              onDragStart={() => handleDragStart(s.name)}
              onDragEnd={() => setDragging(null)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-heading font-medium cursor-grab active:cursor-grabbing whitespace-nowrap select-none flex-shrink-0"
              style={{
                background: `${SUBJECT_COLORS[i % SUBJECT_COLORS.length].replace("0.85", "0.12")}`,
                border: `1px solid ${SUBJECT_COLORS[i % SUBJECT_COLORS.length].replace("0.85", "0.35")}`,
                color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
              }}
              data-ocid={`schedule.dnd.chip.item.${i + 1}`}
            >
              {s.name}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-x-auto">
          <div
            className="grid min-w-[640px]"
            style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}
          >
            {/* Header row */}
            <div className="sticky left-0 z-10" />
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-heading font-bold uppercase tracking-wider py-2"
                style={{ color: "oklch(var(--muted-foreground))" }}
              >
                {day.slice(0, 3)}
              </div>
            ))}

            {/* Hour rows */}
            {GRID_HOURS.map((hour) => (
              <>
                {/* Time label */}
                <div
                  key={`label-${hour}`}
                  className="text-[10px] font-heading text-muted-foreground text-right pr-2 flex items-center justify-end"
                  style={{ minHeight: "44px" }}
                >
                  {formatHour(hour)}
                </div>

                {/* Day slots */}
                {DAYS.map((day, di) => {
                  const key = slotKey(day, hour);
                  const slot = slots[key];
                  const globalIdx =
                    (GRID_HOURS.indexOf(hour) * DAYS.length + di) % 99;

                  return (
                    <div
                      key={key}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                      }}
                      onDrop={() => handleDrop(day, hour)}
                      className="border-l border-t relative transition-colors"
                      style={{
                        minHeight: "44px",
                        borderColor: "oklch(var(--border) / 0.5)",
                        background: slot
                          ? `${SUBJECT_COLORS[slot.colorIdx % SUBJECT_COLORS.length].replace("0.85", "0.12")}`
                          : dragging
                            ? "oklch(var(--muted) / 0.4)"
                            : "transparent",
                      }}
                      data-ocid={`schedule.dnd.slot.item.${globalIdx + 1}`}
                    >
                      {slot ? (
                        <div className="absolute inset-0.5 rounded flex items-center justify-between px-1.5 gap-1">
                          <span
                            className="text-[10px] font-heading font-medium leading-tight line-clamp-2 flex-1"
                            style={{
                              color:
                                SUBJECT_COLORS[
                                  slot.colorIdx % SUBJECT_COLORS.length
                                ],
                            }}
                          >
                            {slot.subject}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(day, hour)}
                            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                            style={{ color: "oklch(var(--destructive))" }}
                            aria-label="Remove"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile subject chips (shown below grid on mobile) */}
      <div
        className="sm:hidden rounded-xl p-3 space-y-2"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
        }}
      >
        <p className="text-[10px] font-heading text-muted-foreground uppercase tracking-wider">
          Tap to drag subjects onto the grid above
        </p>
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((s, i) => (
            <div
              key={s.code}
              draggable
              onDragStart={() => handleDragStart(s.name)}
              onDragEnd={() => setDragging(null)}
              className="px-2 py-1 rounded text-[10px] font-heading font-medium cursor-grab select-none"
              style={{
                background: `${SUBJECT_COLORS[i % SUBJECT_COLORS.length].replace("0.85", "0.12")}`,
                border: `1px solid ${SUBJECT_COLORS[i % SUBJECT_COLORS.length].replace("0.35", "0.3")}`,
                color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
              }}
            >
              {s.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Manual Planner wrapper (Form / DnD toggle) ───────────────────────────────

function ManualPlannerTab() {
  const [mode, setMode] = useState<"form" | "dnd">("form");

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{
          background: "oklch(var(--muted) / 0.4)",
          border: "1px solid oklch(var(--border))",
        }}
      >
        {(["form", "dnd"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            data-ocid="schedule.manual.mode.toggle"
            className="px-4 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all"
            style={{
              background: mode === m ? "oklch(var(--card))" : "transparent",
              color:
                mode === m
                  ? "oklch(var(--primary))"
                  : "oklch(var(--muted-foreground))",
              boxShadow:
                mode === m
                  ? "0 1px 4px oklch(var(--shadow, 0 0 0) / 0.1)"
                  : "none",
            }}
          >
            {m === "form" ? (
              <span className="flex items-center gap-1.5">
                <PenLine className="w-3 h-3" />
                Form Entry
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <GripVertical className="w-3 h-3" />
                Drag &amp; Drop
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: mode === "form" ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: mode === "form" ? 12 : -12 }}
          transition={{ duration: 0.2 }}
        >
          {mode === "form" ? <FormEntryPlanner /> : <DragDropPlanner />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ScheduleMakerPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <CalendarClock
              className="w-6 h-6"
              style={{ color: "oklch(var(--primary))" }}
            />
            <h2 className="font-display text-2xl font-bold text-foreground">
              Schedule Maker
            </h2>
          </div>
          <p className="text-sm text-muted-foreground font-heading">
            AI-powered schedule generation or build your own — your way.
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="ai">
          <TabsList
            className="h-11 gap-1 p-1 font-heading"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            <TabsTrigger
              value="ai"
              className="gap-2 text-sm px-5 h-9 font-heading font-medium"
              data-ocid="schedule.ai_tab.tab"
            >
              <Brain className="w-4 h-4" />
              AI Generator
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="gap-2 text-sm px-5 h-9 font-heading font-medium"
              data-ocid="schedule.manual_tab.tab"
            >
              <BookOpen className="w-4 h-4" />
              Manual Planner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="mt-5">
            <AnimatePresence mode="wait">
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <AIGeneratorTab />
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="manual" className="mt-5">
            <AnimatePresence mode="wait">
              <motion.div
                key="manual"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ManualPlannerTab />
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer
          className="pt-4 border-t text-center"
          style={{ borderColor: "oklch(var(--border))" }}
        >
          <p className="text-xs text-muted-foreground font-heading">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Built with ♥ using caffeine.ai
            </a>
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
