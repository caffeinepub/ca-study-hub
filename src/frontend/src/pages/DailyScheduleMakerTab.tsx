import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  BookOpen,
  Brain,
  Check,
  Clock,
  Copy,
  Dumbbell,
  GripVertical,
  Heart,
  Moon,
  PenLine,
  Plus,
  Save,
  Sparkles,
  Sun,
  Trash2,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CA_Level } from "../backend.d";
import { CA_SUBJECTS, LEVEL_LABELS } from "../data/subjects";

// ─── Types ───────────────────────────────────────────────────────────────────

type DayName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

const DAYS: DayName[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAY_SHORT: Record<DayName, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

type BlockCategory =
  | "Study"
  | "Lecture"
  | "Hobby"
  | "Personal Task"
  | "Meal & Break"
  | "Exercise"
  | "Sleep"
  | "Wake Up"
  | "Other";

interface DailyBlock {
  id: string;
  day: DayName;
  startTime: string; // "HH:MM"
  endTime: string;
  label: string;
  category: BlockCategory;
  color: string;
}

interface LectureSlot {
  id: string;
  label: string;
  startTime: string;
  durationMins: number;
}

interface SavedTemplate {
  name: string;
  blocks: DailyBlock[];
  savedAt: string;
}

// ─── Color Map ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<BlockCategory, string> = {
  Study: "oklch(0.55 0.18 30)", // primary-like amber-gold
  Lecture: "oklch(0.55 0.18 280)", // purple
  Hobby: "oklch(0.55 0.18 145)", // green
  "Personal Task": "oklch(0.60 0.18 70)", // amber
  "Meal & Break": "oklch(0.60 0.18 50)", // orange
  Exercise: "oklch(0.55 0.18 195)", // teal
  Sleep: "oklch(0.45 0.12 260)", // dark indigo
  "Wake Up": "oklch(0.65 0.15 80)", // gold
  Other: "oklch(0.55 0.12 220)", // neutral blue
};

const CATEGORY_BG: Record<BlockCategory, string> = {
  Study: "oklch(0.55 0.18 30 / 0.12)",
  Lecture: "oklch(0.55 0.18 280 / 0.12)",
  Hobby: "oklch(0.55 0.18 145 / 0.12)",
  "Personal Task": "oklch(0.60 0.18 70 / 0.12)",
  "Meal & Break": "oklch(0.60 0.18 50 / 0.12)",
  Exercise: "oklch(0.55 0.18 195 / 0.12)",
  Sleep: "oklch(0.45 0.12 260 / 0.12)",
  "Wake Up": "oklch(0.65 0.15 80 / 0.12)",
  Other: "oklch(0.55 0.12 220 / 0.12)",
};

const CATEGORY_BORDER: Record<BlockCategory, string> = {
  Study: "oklch(0.55 0.18 30 / 0.35)",
  Lecture: "oklch(0.55 0.18 280 / 0.35)",
  Hobby: "oklch(0.55 0.18 145 / 0.35)",
  "Personal Task": "oklch(0.60 0.18 70 / 0.35)",
  "Meal & Break": "oklch(0.60 0.18 50 / 0.35)",
  Exercise: "oklch(0.55 0.18 195 / 0.35)",
  Sleep: "oklch(0.45 0.12 260 / 0.35)",
  "Wake Up": "oklch(0.65 0.15 80 / 0.35)",
  Other: "oklch(0.55 0.12 220 / 0.35)",
};

function CategoryIcon({
  cat,
  size = 14,
}: {
  cat: BlockCategory;
  size?: number;
}) {
  const cls = "flex-shrink-0";
  const style = { width: size, height: size };
  switch (cat) {
    case "Study":
      return <BookOpen className={cls} style={style} />;
    case "Lecture":
      return <Brain className={cls} style={style} />;
    case "Hobby":
      return <Heart className={cls} style={style} />;
    case "Personal Task":
      return <Zap className={cls} style={style} />;
    case "Meal & Break":
      return <UtensilsCrossed className={cls} style={style} />;
    case "Exercise":
      return <Dumbbell className={cls} style={style} />;
    case "Sleep":
      return <Moon className={cls} style={style} />;
    case "Wake Up":
      return <Sun className={cls} style={style} />;
    default:
      return <Clock className={cls} style={style} />;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minsToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function formatTime12(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Generates an array of time ticks (every 60 min) between two times
function generateTimeTicks(startTime: string, endTime: string): string[] {
  let s = timeToMins(startTime);
  const e = timeToMins(endTime);
  const ticks: string[] = [];
  while (s <= e) {
    ticks.push(minsToTime(s));
    s += 60;
  }
  return ticks;
}

// ─── AI Schedule Engine ───────────────────────────────────────────────────────

type TimePref = "morning" | "afternoon" | "evening" | "night";

const CA_SUBJECTS_BY_LEVEL: Record<CA_Level, string[]> = {
  [CA_Level.foundation]: CA_SUBJECTS.filter(
    (s) => s.level === CA_Level.foundation,
  ).map((s) => s.name),
  [CA_Level.intermediate]: CA_SUBJECTS.filter(
    (s) => s.level === CA_Level.intermediate,
  ).map((s) => s.name),
  [CA_Level.final_]: CA_SUBJECTS.filter((s) => s.level === CA_Level.final_).map(
    (s) => s.name,
  ),
};

interface AIInputs {
  wakeTime: string;
  sleepTime: string;
  level: CA_Level;
  dailyHours: number;
  timePref: TimePref;
  lectures: LectureSlot[];
  exerciseMins: number;
  hobbies: string[];
  personalTasks: string[];
  mealMins: number;
  generateMode: "single" | "week";
}

function buildDaySchedule(
  inputs: AIInputs,
  day: DayName,
  isSunday: boolean,
  isSaturday: boolean,
): DailyBlock[] {
  const blocks: DailyBlock[] = [];
  const wakeM = timeToMins(inputs.wakeTime);
  const sleepM = timeToMins(inputs.sleepTime);
  const { mealMins, exerciseMins, timePref } = inputs;

  // Track occupied ranges: [startM, endM]
  const occupied: Array<[number, number]> = [];

  function addBlock(
    startM: number,
    durationM: number,
    label: string,
    category: BlockCategory,
  ): number {
    const endM = startM + durationM;
    occupied.push([startM, endM]);
    blocks.push({
      id: makeId(),
      day,
      startTime: minsToTime(startM),
      endTime: minsToTime(endM),
      label,
      category,
      color: CATEGORY_COLORS[category],
    });
    return endM;
  }

  function isOverlapping(startM: number, endM: number): boolean {
    return occupied.some(([os, oe]) => startM < oe && endM > os);
  }

  function findFreeSlot(
    fromM: number,
    toM: number,
    durationM: number,
  ): number | null {
    let cursor = fromM;
    while (cursor + durationM <= toM) {
      if (!isOverlapping(cursor, cursor + durationM)) return cursor;
      // Advance past next occupied block
      const blocking = occupied.find(([os, oe]) => cursor < oe && cursor >= os);
      if (blocking) cursor = blocking[1];
      else cursor += 15;
    }
    return null;
  }

  // 1. Wake Up (15 min)
  addBlock(wakeM, 15, "Wake Up & Morning Routine", "Wake Up");

  // 2. Breakfast
  addBlock(wakeM + 15, mealMins, "Breakfast", "Meal & Break");

  // 3. Exercise
  if (exerciseMins > 0) {
    const afterBreakfast = wakeM + 15 + mealMins;
    if (timePref === "morning" || timePref === "night") {
      const slot = findFreeSlot(
        afterBreakfast,
        afterBreakfast + 120,
        exerciseMins,
      );
      if (slot !== null)
        addBlock(slot, exerciseMins, "Exercise / Workout", "Exercise");
    } else {
      // Evening ~17:00
      const evening = 17 * 60;
      const slot = findFreeSlot(evening, evening + 120, exerciseMins);
      if (slot !== null)
        addBlock(slot, exerciseMins, "Exercise / Workout", "Exercise");
    }
  }

  // 4. Lunch at ~13:00
  const lunchStart = 13 * 60;
  const lunchActual = isOverlapping(lunchStart, lunchStart + mealMins)
    ? (findFreeSlot(12 * 60 + 30, 14 * 60, mealMins) ?? lunchStart + 15)
    : lunchStart;
  addBlock(lunchActual, mealMins, "Lunch Break", "Meal & Break");

  // 5. Dinner at ~19:30
  const dinnerStart = 19 * 60 + 30;
  const dinnerActual = isOverlapping(dinnerStart, dinnerStart + mealMins)
    ? (findFreeSlot(19 * 60, 21 * 60, mealMins) ?? dinnerStart + 15)
    : dinnerStart;
  addBlock(dinnerActual, mealMins, "Dinner Break", "Meal & Break");

  // 6. Lectures
  inputs.lectures.forEach((lec, i) => {
    const lecStart = timeToMins(lec.startTime);
    const endM = lecStart + lec.durationMins;
    if (!isOverlapping(lecStart, endM) && lecStart >= wakeM && endM <= sleepM) {
      addBlock(
        lecStart,
        lec.durationMins,
        lec.label || `Lecture ${i + 1}`,
        "Lecture",
      );
    }
  });

  // 7. Study blocks
  const subjects = CA_SUBJECTS_BY_LEVEL[inputs.level];
  const totalStudyMins = isSunday
    ? Math.floor(inputs.dailyHours * 0.4 * 60)
    : isSaturday
      ? Math.floor(inputs.dailyHours * 0.7 * 60)
      : inputs.dailyHours * 60;

  // Determine study window
  let studyWindowStart: number;
  let studyWindowEnd: number;
  switch (timePref) {
    case "morning":
      studyWindowStart = wakeM + 15 + inputs.mealMins;
      studyWindowEnd = 12 * 60;
      break;
    case "afternoon":
      studyWindowStart = 12 * 60;
      studyWindowEnd = 18 * 60;
      break;
    case "evening":
      studyWindowStart = 18 * 60;
      studyWindowEnd = 22 * 60;
      break;
    case "night":
      studyWindowStart = 21 * 60;
      studyWindowEnd = sleepM;
      break;
  }

  let studyPlaced = 0;
  let subjectIdx = 0;
  const blockDuration = 90; // 1.5h study blocks

  while (studyPlaced < totalStudyMins) {
    const remaining = totalStudyMins - studyPlaced;
    const thisDuration = Math.min(blockDuration, remaining);
    const slot = findFreeSlot(studyWindowStart, studyWindowEnd, thisDuration);
    if (slot === null) {
      // Try anywhere in the day
      const slot2 = findFreeSlot(wakeM, sleepM, thisDuration);
      if (slot2 === null) break;
      const subjectLabel = isSunday
        ? `${subjects[subjectIdx % subjects.length]} – Revision`
        : subjects[subjectIdx % subjects.length];
      addBlock(slot2, thisDuration, subjectLabel, "Study");
    } else {
      const subjectLabel = isSunday
        ? `${subjects[subjectIdx % subjects.length]} – Revision`
        : subjects[subjectIdx % subjects.length];
      addBlock(slot, thisDuration, subjectLabel, "Study");
    }
    studyPlaced += thisDuration;
    subjectIdx++;
  }

  // 8. Hobbies in evening gaps
  const hobbyWindow = [18 * 60, 21 * 60] as [number, number];
  for (const hobby of inputs.hobbies) {
    const slot = findFreeSlot(hobbyWindow[0], hobbyWindow[1], 45);
    if (slot !== null && slot + 45 <= sleepM) {
      addBlock(slot, 45, hobby, "Hobby");
    }
  }

  // 9. Personal tasks in afternoon gaps
  const taskWindow = [14 * 60, 17 * 60] as [number, number];
  for (const task of inputs.personalTasks) {
    const slot = findFreeSlot(taskWindow[0], taskWindow[1], 30);
    if (slot !== null && slot + 30 <= sleepM) {
      addBlock(slot, 30, task, "Personal Task");
    }
  }

  // 10. Sleep
  addBlock(sleepM, 60, "Sleep", "Sleep");

  // Sort by start time
  return blocks.sort(
    (a, b) => timeToMins(a.startTime) - timeToMins(b.startTime),
  );
}

function generateDailySchedule(
  inputs: AIInputs,
): Record<DayName, DailyBlock[]> {
  const result: Partial<Record<DayName, DailyBlock[]>> = {};
  const daysToGenerate: DayName[] =
    inputs.generateMode === "single" ? ["Monday"] : DAYS;
  for (const day of daysToGenerate) {
    result[day] = buildDaySchedule(
      inputs,
      day,
      day === "Sunday",
      day === "Saturday",
    );
  }
  return result as Record<DayName, DailyBlock[]>;
}

function scheduleToClipboardText(
  schedule: Record<DayName, DailyBlock[]>,
  mode: "single" | "week",
): string {
  const days = mode === "single" ? (["Monday"] as DayName[]) : DAYS;
  return days
    .filter((d) => schedule[d]?.length > 0)
    .map((day) => {
      const lines = schedule[day]
        .map(
          (b) =>
            `  ${formatTime12(b.startTime)} – ${formatTime12(b.endTime)}: ${b.label} (${b.category})`,
        )
        .join("\n");
      return `${day}:\n${lines}`;
    })
    .join("\n\n");
}

// ─── Vertical Timeline component ─────────────────────────────────────────────

function VerticalTimeline({
  blocks,
  wakeTime,
  sleepTime,
}: {
  blocks: DailyBlock[];
  wakeTime: string;
  sleepTime: string;
}) {
  const ticks = generateTimeTicks(wakeTime, sleepTime);

  return (
    <div className="relative flex gap-3">
      {/* Time axis */}
      <div className="flex flex-col w-14 flex-shrink-0">
        {ticks.map((tick) => (
          <div
            key={tick}
            className="h-12 flex items-start pt-0.5"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            <span className="text-[10px] font-heading leading-none">
              {formatTime12(tick)}
            </span>
          </div>
        ))}
      </div>

      {/* Blocks column */}
      <div className="flex-1 space-y-1.5">
        <AnimatePresence>
          {blocks.map((block, i) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ delay: i * 0.02, duration: 0.18 }}
              className="rounded-lg px-3 py-2 flex items-center gap-2.5"
              style={{
                background: CATEGORY_BG[block.category],
                border: `1px solid ${CATEGORY_BORDER[block.category]}`,
                minHeight: "44px",
              }}
            >
              <span style={{ color: CATEGORY_COLORS[block.category] }}>
                <CategoryIcon cat={block.category} size={13} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-heading font-semibold text-foreground leading-tight line-clamp-1">
                  {block.label}
                </p>
                <p
                  className="text-[10px] font-heading mt-0.5"
                  style={{ color: CATEGORY_COLORS[block.category] }}
                >
                  {formatTime12(block.startTime)} –{" "}
                  {formatTime12(block.endTime)}
                </p>
              </div>
              <Badge
                className="text-[9px] px-1.5 py-0 h-4 font-heading flex-shrink-0"
                style={{
                  background: CATEGORY_BG[block.category],
                  color: CATEGORY_COLORS[block.category],
                  border: `1px solid ${CATEGORY_BORDER[block.category]}`,
                }}
              >
                {block.category}
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>
        {blocks.length === 0 && (
          <div
            className="rounded-xl p-6 text-center"
            style={{
              background: "oklch(var(--muted) / 0.3)",
              border: "1px dashed oklch(var(--border))",
            }}
            data-ocid="schedule.daily.empty_state"
          >
            <Clock
              className="w-8 h-8 mx-auto mb-2 opacity-25"
              style={{ color: "oklch(var(--primary))" }}
            />
            <p className="text-xs text-muted-foreground font-heading">
              No blocks for this day
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Color Legend ─────────────────────────────────────────────────────────────

const LEGEND_ITEMS: BlockCategory[] = [
  "Study",
  "Lecture",
  "Exercise",
  "Hobby",
  "Personal Task",
  "Meal & Break",
  "Sleep",
  "Wake Up",
];

function ColorLegend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-2">
      {LEGEND_ITEMS.map((cat) => (
        <div key={cat} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{
              background: CATEGORY_BG[cat],
              border: `1px solid ${CATEGORY_BORDER[cat]}`,
            }}
          />
          <span
            className="text-[10px] font-heading"
            style={{ color: "oklch(var(--muted-foreground))" }}
          >
            {cat}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── AI Daily Planner ─────────────────────────────────────────────────────────

function AIDailyPlanner() {
  const [wakeTime, setWakeTime] = useState("06:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [level, setLevel] = useState<CA_Level>(CA_Level.intermediate);
  const [dailyHours, setDailyHours] = useState(5);
  const [timePref, setTimePref] = useState<TimePref>("morning");
  const [lectures, setLectures] = useState<LectureSlot[]>([]);
  const [exerciseMins, setExerciseMins] = useState(30);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyInput, setHobbyInput] = useState("");
  const [personalTasks, setPersonalTasks] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const [mealMins, setMealMins] = useState(30);
  const [generateMode, setGenerateMode] = useState<"single" | "week">("single");
  const [schedule, setSchedule] = useState<Record<
    DayName,
    DailyBlock[]
  > | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeDay, setActiveDay] = useState<DayName>("Monday");
  const [copied, setCopied] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(() => {
    try {
      const raw = localStorage.getItem("ca_daily_templates");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const TIME_PREFS = [
    {
      id: "morning" as TimePref,
      label: "Morning",
      sub: "6am–12pm",
      emoji: "🌅",
    },
    {
      id: "afternoon" as TimePref,
      label: "Afternoon",
      sub: "12pm–6pm",
      emoji: "☀️",
    },
    {
      id: "evening" as TimePref,
      label: "Evening",
      sub: "6pm–10pm",
      emoji: "🌇",
    },
    { id: "night" as TimePref, label: "Night", sub: "10pm–2am", emoji: "🌙" },
  ];

  // --- Lectures ---
  const addLecture = () => {
    setLectures((prev) => [
      ...prev,
      { id: makeId(), label: "", startTime: "10:00", durationMins: 60 },
    ]);
  };

  const updateLecture = (id: string, patch: Partial<LectureSlot>) => {
    setLectures((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    );
  };

  const removeLecture = (id: string) => {
    setLectures((prev) => prev.filter((l) => l.id !== id));
  };

  // --- Tag helpers ---
  const addHobby = () => {
    const trimmed = hobbyInput.trim();
    if (!trimmed || hobbies.includes(trimmed)) return;
    setHobbies((prev) => [...prev, trimmed]);
    setHobbyInput("");
  };

  const addTask = () => {
    const trimmed = taskInput.trim();
    if (!trimmed || personalTasks.includes(trimmed)) return;
    setPersonalTasks((prev) => [...prev, trimmed]);
    setTaskInput("");
  };

  // --- Generate ---
  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const result = generateDailySchedule({
        wakeTime,
        sleepTime,
        level,
        dailyHours,
        timePref,
        lectures,
        exerciseMins,
        hobbies,
        personalTasks,
        mealMins,
        generateMode,
      });
      setSchedule(result);
      setActiveDay("Monday");
      setGenerating(false);
      toast.success(
        generateMode === "single"
          ? "Daily schedule generated!"
          : "7-day schedule generated!",
      );
    }, 700);
  };

  // --- Copy ---
  const handleCopy = async () => {
    if (!schedule) return;
    const text = scheduleToClipboardText(schedule, generateMode);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Schedule copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Save template ---
  const handleSaveTemplate = () => {
    if (!schedule) return;
    const name =
      templateName.trim() || `Schedule ${new Date().toLocaleDateString()}`;
    const template: SavedTemplate = {
      name,
      blocks: Object.values(schedule).flat(),
      savedAt: new Date().toISOString(),
    };
    const updated = [template, ...savedTemplates.slice(0, 4)];
    setSavedTemplates(updated);
    localStorage.setItem("ca_daily_templates", JSON.stringify(updated));
    setTemplateName("");
    toast.success(`Template "${name}" saved!`);
  };

  const daysToShow: DayName[] = generateMode === "single" ? ["Monday"] : DAYS;

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
          <Sparkles
            className="w-5 h-5"
            style={{ color: "oklch(var(--primary))" }}
          />
          <h3 className="font-display text-base font-bold text-foreground">
            AI Daily Schedule Builder
          </h3>
        </div>

        {/* Row 1: Wake / Sleep / Level */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
              Wake Time
            </Label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full h-10 px-3 rounded-md border font-heading text-sm bg-transparent text-foreground"
              style={{
                borderColor: "oklch(var(--border))",
                background: "oklch(var(--input) / 0.5)",
              }}
              data-ocid="schedule.daily.wake_time.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
              Sleep Time
            </Label>
            <input
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              className="w-full h-10 px-3 rounded-md border font-heading text-sm bg-transparent text-foreground"
              style={{
                borderColor: "oklch(var(--border))",
                background: "oklch(var(--input) / 0.5)",
              }}
              data-ocid="schedule.daily.sleep_time.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
              CA Level
            </Label>
            <Select
              value={level}
              onValueChange={(v) => setLevel(v as CA_Level)}
            >
              <SelectTrigger
                className="h-10 font-heading text-sm"
                data-ocid="schedule.daily.level.select"
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
        </div>

        {/* Daily study hours */}
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
            max={10}
            step={0.5}
            value={[dailyHours]}
            onValueChange={([v]) => setDailyHours(v)}
            className="w-full"
            data-ocid="schedule.daily.hours.input"
          />
          <div className="flex justify-between text-[10px] font-heading text-muted-foreground">
            <span>1h</span>
            <span>5h</span>
            <span>10h</span>
          </div>
        </div>

        {/* Preferred study window */}
        <div className="space-y-2">
          <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
            Preferred Study Window
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIME_PREFS.map((tp) => (
              <button
                key={tp.id}
                type="button"
                onClick={() => setTimePref(tp.id)}
                data-ocid="schedule.daily.time_pref.toggle"
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

        {/* Exercise & Meals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
              Exercise Duration
            </Label>
            <Select
              value={String(exerciseMins)}
              onValueChange={(v) => setExerciseMins(Number(v))}
            >
              <SelectTrigger
                className="h-10 font-heading text-sm"
                data-ocid="schedule.daily.exercise.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" className="font-heading text-sm">
                  None
                </SelectItem>
                <SelectItem value="30" className="font-heading text-sm">
                  30 min
                </SelectItem>
                <SelectItem value="45" className="font-heading text-sm">
                  45 min
                </SelectItem>
                <SelectItem value="60" className="font-heading text-sm">
                  60 min
                </SelectItem>
                <SelectItem value="90" className="font-heading text-sm">
                  90 min
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
              Meal Break Duration
            </Label>
            <Select
              value={String(mealMins)}
              onValueChange={(v) => setMealMins(Number(v))}
            >
              <SelectTrigger
                className="h-10 font-heading text-sm"
                data-ocid="schedule.daily.meal_duration.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15" className="font-heading text-sm">
                  15 min
                </SelectItem>
                <SelectItem value="30" className="font-heading text-sm">
                  30 min
                </SelectItem>
                <SelectItem value="45" className="font-heading text-sm">
                  45 min
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lectures */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
              Lectures / Coaching
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLecture}
              className="h-7 text-xs font-heading gap-1"
              data-ocid="schedule.daily.add_lecture.button"
            >
              <Plus className="w-3 h-3" />
              Add Lecture
            </Button>
          </div>
          <AnimatePresence>
            {lectures.map((lec, i) => (
              <motion.div
                key={lec.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
                data-ocid={`schedule.daily.lecture.item.${i + 1}`}
              >
                <div
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-xl mb-2"
                  style={{
                    background: "oklch(var(--muted) / 0.25)",
                    border: "1px solid oklch(var(--border))",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Lecture name"
                    value={lec.label}
                    onChange={(e) =>
                      updateLecture(lec.id, { label: e.target.value })
                    }
                    className="h-9 px-3 rounded-md border font-heading text-sm bg-transparent text-foreground"
                    style={{
                      borderColor: "oklch(var(--border))",
                      background: "oklch(var(--input) / 0.5)",
                    }}
                  />
                  <input
                    type="time"
                    value={lec.startTime}
                    onChange={(e) =>
                      updateLecture(lec.id, { startTime: e.target.value })
                    }
                    className="h-9 px-3 rounded-md border font-heading text-sm bg-transparent text-foreground"
                    style={{
                      borderColor: "oklch(var(--border))",
                      background: "oklch(var(--input) / 0.5)",
                    }}
                  />
                  <div className="flex gap-2">
                    <Select
                      value={String(lec.durationMins)}
                      onValueChange={(v) =>
                        updateLecture(lec.id, { durationMins: Number(v) })
                      }
                    >
                      <SelectTrigger className="h-9 flex-1 font-heading text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">1 hr</SelectItem>
                        <SelectItem value="90">1.5 hr</SelectItem>
                        <SelectItem value="120">2 hr</SelectItem>
                        <SelectItem value="180">3 hr</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => removeLecture(lec.id)}
                      className="h-9 w-9 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
                      style={{
                        background: "oklch(var(--destructive) / 0.1)",
                        color: "oklch(var(--destructive))",
                      }}
                      aria-label="Remove lecture"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {lectures.length === 0 && (
            <p className="text-[11px] font-heading text-muted-foreground italic">
              No lectures added. Click "Add Lecture" to include coaching/college
              slots.
            </p>
          )}
        </div>

        {/* Hobbies */}
        <div className="space-y-2">
          <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
            Hobbies
          </Label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Guitar, Drawing, Gaming"
              value={hobbyInput}
              onChange={(e) => setHobbyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addHobby()}
              className="flex-1 h-9 px-3 rounded-md border font-heading text-sm bg-transparent text-foreground"
              style={{
                borderColor: "oklch(var(--border))",
                background: "oklch(var(--input) / 0.5)",
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHobby}
              className="h-9 w-9 p-0"
              aria-label="Add hobby"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {hobbies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hobbies.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-heading"
                  style={{
                    background: CATEGORY_BG.Hobby,
                    color: CATEGORY_COLORS.Hobby,
                    border: `1px solid ${CATEGORY_BORDER.Hobby}`,
                  }}
                >
                  {h}
                  <button
                    type="button"
                    onClick={() =>
                      setHobbies((prev) => prev.filter((x) => x !== h))
                    }
                    className="hover:opacity-70 transition-opacity"
                    aria-label={`Remove ${h}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Personal Tasks */}
        <div className="space-y-2">
          <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
            Personal Tasks
          </Label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Grocery shopping, Call parents"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              className="flex-1 h-9 px-3 rounded-md border font-heading text-sm bg-transparent text-foreground"
              style={{
                borderColor: "oklch(var(--border))",
                background: "oklch(var(--input) / 0.5)",
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTask}
              className="h-9 w-9 p-0"
              aria-label="Add task"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {personalTasks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {personalTasks.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-heading"
                  style={{
                    background: CATEGORY_BG["Personal Task"],
                    color: CATEGORY_COLORS["Personal Task"],
                    border: `1px solid ${CATEGORY_BORDER["Personal Task"]}`,
                  }}
                >
                  {t}
                  <button
                    type="button"
                    onClick={() =>
                      setPersonalTasks((prev) => prev.filter((x) => x !== t))
                    }
                    className="hover:opacity-70 transition-opacity"
                    aria-label={`Remove ${t}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Generate Mode */}
        <div className="space-y-2">
          <Label className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
            Generate Mode
          </Label>
          <div
            className="flex items-center gap-1 p-1 rounded-xl w-fit"
            style={{
              background: "oklch(var(--muted) / 0.4)",
              border: "1px solid oklch(var(--border))",
            }}
          >
            {(["single", "week"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setGenerateMode(m)}
                data-ocid="schedule.daily.generate_mode.toggle"
                className="px-4 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all"
                style={{
                  background:
                    generateMode === m ? "oklch(var(--card))" : "transparent",
                  color:
                    generateMode === m
                      ? "oklch(var(--primary))"
                      : "oklch(var(--muted-foreground))",
                  boxShadow:
                    generateMode === m
                      ? "0 1px 4px oklch(0 0 0 / 0.1)"
                      : "none",
                }}
              >
                {m === "single" ? "Single Day Template" : "Full 7-Day Plan"}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full h-11 font-heading font-semibold text-sm gap-2"
          style={{
            background: "oklch(var(--primary))",
            color: "oklch(var(--primary-foreground))",
          }}
          data-ocid="schedule.daily.generate.primary_button"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Building your schedule...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Daily Schedule
            </>
          )}
        </Button>
      </div>

      {/* Schedule Output */}
      <AnimatePresence>
        {schedule && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  {generateMode === "single"
                    ? "Your Daily Schedule"
                    : "Your 7-Day Schedule"}
                </h3>
                <p className="text-xs text-muted-foreground font-heading mt-0.5">
                  {generateMode === "week"
                    ? "Navigate between days using the tabs below"
                    : ""}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="font-heading text-xs gap-1.5"
                  data-ocid="schedule.daily.copy.button"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy as Text"}
                </Button>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Template name..."
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="h-8 px-2.5 rounded-md border font-heading text-xs bg-transparent text-foreground w-36"
                    style={{
                      borderColor: "oklch(var(--border))",
                      background: "oklch(var(--input) / 0.5)",
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveTemplate}
                    className="h-8 font-heading text-xs gap-1.5"
                    data-ocid="schedule.daily.save_template.button"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </Button>
                </div>
              </div>
            </div>

            {/* Day tabs if week mode */}
            {generateMode === "week" && (
              <div className="flex gap-1 overflow-x-auto pb-1">
                {daysToShow.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setActiveDay(day)}
                    data-ocid="schedule.daily.day.tab"
                    className="px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all flex-shrink-0"
                    style={{
                      background:
                        activeDay === day
                          ? "oklch(var(--primary) / 0.12)"
                          : "oklch(var(--muted) / 0.3)",
                      borderColor:
                        activeDay === day
                          ? "oklch(var(--primary) / 0.4)"
                          : "oklch(var(--border))",
                      color:
                        activeDay === day
                          ? "oklch(var(--primary))"
                          : "oklch(var(--muted-foreground))",
                      border: "1px solid",
                    }}
                  >
                    {DAY_SHORT[day]}
                  </button>
                ))}
              </div>
            )}

            {/* Timeline */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: "oklch(var(--card))",
                border: "1px solid oklch(var(--border))",
              }}
            >
              <h4 className="font-heading text-sm font-semibold text-foreground mb-4">
                {generateMode === "week" ? activeDay : "Monday"} — Schedule
              </h4>
              <VerticalTimeline
                blocks={
                  schedule[generateMode === "single" ? "Monday" : activeDay] ??
                  []
                }
                wakeTime={wakeTime}
                sleepTime={sleepTime}
              />
              <ColorLegend />
            </div>

            {/* Saved Templates */}
            {savedTemplates.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-heading text-muted-foreground uppercase tracking-wide">
                  Saved Templates
                </p>
                <div className="flex flex-wrap gap-2">
                  {savedTemplates.map((tmpl) => (
                    <div
                      key={tmpl.savedAt}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-heading"
                      style={{
                        background: "oklch(var(--muted) / 0.3)",
                        border: "1px solid oklch(var(--border))",
                      }}
                    >
                      <Save className="w-3 h-3 opacity-50" />
                      <span>{tmpl.name}</span>
                      <span
                        className="text-[10px]"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        {new Date(tmpl.savedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Manual Daily Planner ─────────────────────────────────────────────────────

const MANUAL_CATEGORIES: BlockCategory[] = [
  "Study",
  "Lecture",
  "Hobby",
  "Personal Task",
  "Meal & Break",
  "Exercise",
  "Sleep",
  "Other",
];

const DURATION_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hr", value: 60 },
  { label: "1.5 hr", value: 90 },
  { label: "2 hr", value: 120 },
  { label: "3 hr", value: 180 },
];

const CATEGORY_LABEL_HINTS: Record<BlockCategory, string> = {
  Study: "e.g. Taxation, Audit revision...",
  Lecture: "e.g. CA Intermediate lecture",
  Hobby: "e.g. Guitar practice",
  "Personal Task": "e.g. Grocery shopping",
  "Meal & Break": "e.g. Lunch break",
  Exercise: "e.g. Morning run",
  Sleep: "Sleep",
  "Wake Up": "Morning routine",
  Other: "Custom task",
};

function ManualDailyPlanner() {
  const [activeDay, setActiveDay] = useState<DayName>("Monday");
  const [category, setCategory] = useState<BlockCategory>("Study");
  const [label, setLabel] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [durationMins, setDurationMins] = useState(60);
  const [blocksByDay, setBlocksByDay] = useState<Record<DayName, DailyBlock[]>>(
    () => {
      const initial = {} as Record<DayName, DailyBlock[]>;
      for (const d of DAYS) {
        initial[d] = [];
      }
      return initial;
    },
  );

  const addBlock = useCallback(() => {
    const startM = timeToMins(startTime);
    const endM = startM + durationMins;
    const newBlock: DailyBlock = {
      id: makeId(),
      day: activeDay,
      startTime,
      endTime: minsToTime(endM),
      label: label.trim() || CATEGORY_LABEL_HINTS[category],
      category,
      color: CATEGORY_COLORS[category],
    };
    setBlocksByDay((prev) => ({
      ...prev,
      [activeDay]: [...prev[activeDay], newBlock].sort(
        (a, b) => timeToMins(a.startTime) - timeToMins(b.startTime),
      ),
    }));
    setLabel("");
    toast.success("Block added!");
  }, [activeDay, category, label, startTime, durationMins]);

  const deleteBlock = useCallback((day: DayName, id: string) => {
    setBlocksByDay((prev) => ({
      ...prev,
      [day]: prev[day].filter((b) => b.id !== id),
    }));
  }, []);

  const currentBlocks = blocksByDay[activeDay] ?? [];

  // Derive a pseudo-wakeTime / sleepTime for the timeline ticks
  const earliestBlock = currentBlocks[0];
  const latestBlock = currentBlocks[currentBlocks.length - 1];
  const timelineWake = earliestBlock
    ? minsToTime(Math.max(0, timeToMins(earliestBlock.startTime) - 30))
    : "06:00";
  const timelineSleep = latestBlock
    ? minsToTime(Math.min(23 * 60 + 59, timeToMins(latestBlock.endTime) + 30))
    : "23:00";

  return (
    <div className="space-y-5">
      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAYS.map((day) => {
          const count = blocksByDay[day]?.length ?? 0;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(day)}
              data-ocid="schedule.daily.day.tab"
              className="px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all flex-shrink-0 relative"
              style={{
                background:
                  activeDay === day
                    ? "oklch(var(--primary) / 0.12)"
                    : "oklch(var(--muted) / 0.3)",
                color:
                  activeDay === day
                    ? "oklch(var(--primary))"
                    : "oklch(var(--muted-foreground))",
                border:
                  activeDay === day
                    ? "1px solid oklch(var(--primary) / 0.4)"
                    : "1px solid oklch(var(--border))",
              }}
            >
              {DAY_SHORT[day]}
              {count > 0 && (
                <span
                  className="ml-1 text-[9px] font-bold"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add block form */}
      <div
        className="rounded-2xl p-4 space-y-4"
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
          <h4 className="font-display text-sm font-bold text-foreground">
            Add Block to {activeDay}
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground">
              Category
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as BlockCategory)}
            >
              <SelectTrigger
                className="h-9 font-heading text-sm"
                data-ocid="schedule.daily.category.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_CATEGORIES.map((c) => (
                  <SelectItem
                    key={c}
                    value={c}
                    className="font-heading text-sm"
                  >
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground">
              Label
            </Label>
            <input
              type="text"
              placeholder={CATEGORY_LABEL_HINTS[category]}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBlock()}
              className="w-full h-9 px-3 rounded-md border font-heading text-sm bg-transparent text-foreground"
              style={{
                borderColor: "oklch(var(--border))",
                background: "oklch(var(--input) / 0.5)",
              }}
              data-ocid="schedule.daily.label.input"
            />
          </div>

          {/* Start time */}
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground">
              Start Time
            </Label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-9 px-3 rounded-md border font-heading text-sm bg-transparent text-foreground"
              style={{
                borderColor: "oklch(var(--border))",
                background: "oklch(var(--input) / 0.5)",
              }}
              data-ocid="schedule.daily.start_time.input"
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label className="text-xs font-heading text-muted-foreground">
              Duration
            </Label>
            <Select
              value={String(durationMins)}
              onValueChange={(v) => setDurationMins(Number(v))}
            >
              <SelectTrigger
                className="h-9 font-heading text-sm"
                data-ocid="schedule.daily.duration.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem
                    key={d.value}
                    value={String(d.value)}
                    className="font-heading text-sm"
                  >
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={addBlock}
          className="h-9 font-heading text-sm gap-2"
          style={{
            background: "oklch(var(--primary))",
            color: "oklch(var(--primary-foreground))",
          }}
          data-ocid="schedule.daily.add_block.button"
        >
          <Plus className="w-4 h-4" />
          Add to {activeDay}
        </Button>
      </div>

      {/* Day timeline */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "oklch(var(--card))",
          border: "1px solid oklch(var(--border))",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-heading text-sm font-semibold text-foreground">
            {activeDay} — {currentBlocks.length} block
            {currentBlocks.length !== 1 ? "s" : ""}
          </h4>
          {currentBlocks.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setBlocksByDay((prev) => ({ ...prev, [activeDay]: [] }))
              }
              className="text-[11px] font-heading transition-colors"
              style={{ color: "oklch(var(--destructive))" }}
            >
              Clear all
            </button>
          )}
        </div>

        {currentBlocks.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: "oklch(var(--muted) / 0.3)",
              border: "1px dashed oklch(var(--border))",
            }}
            data-ocid="schedule.daily.empty_state"
          >
            <GripVertical
              className="w-9 h-9 mx-auto mb-2 opacity-25"
              style={{ color: "oklch(var(--primary))" }}
            />
            <p className="text-sm font-heading text-muted-foreground">
              No blocks added for {activeDay} yet
            </p>
            <p className="text-[11px] text-muted-foreground font-heading mt-1">
              Use the form above to add study, lecture, hobby, and life task
              blocks
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {currentBlocks.map((block, i) => (
                <motion.div
                  key={block.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18 }}
                  className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{
                    background: CATEGORY_BG[block.category],
                    border: `1px solid ${CATEGORY_BORDER[block.category]}`,
                  }}
                  data-ocid={`schedule.daily.block.item.${i + 1}`}
                >
                  <span style={{ color: CATEGORY_COLORS[block.category] }}>
                    <CategoryIcon cat={block.category} size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-heading font-semibold text-foreground leading-tight line-clamp-1">
                      {block.label}
                    </p>
                    <p
                      className="text-[10px] font-heading mt-0.5"
                      style={{ color: CATEGORY_COLORS[block.category] }}
                    >
                      {formatTime12(block.startTime)} –{" "}
                      {formatTime12(block.endTime)}
                    </p>
                  </div>
                  <Badge
                    className="text-[9px] px-1.5 py-0 h-4 font-heading hidden sm:flex"
                    style={{
                      background: CATEGORY_BG[block.category],
                      color: CATEGORY_COLORS[block.category],
                      border: `1px solid ${CATEGORY_BORDER[block.category]}`,
                    }}
                  >
                    {block.category}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => deleteBlock(activeDay, block.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                    style={{ color: "oklch(var(--destructive))" }}
                    aria-label="Delete block"
                    data-ocid={`schedule.daily.block.delete_button.${i + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {currentBlocks.length > 0 && (
          <>
            <ColorLegend />
            <div
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid oklch(var(--border))" }}
            >
              <p className="text-[11px] font-heading text-muted-foreground mb-3 uppercase tracking-wide">
                Timeline View
              </p>
              <VerticalTimeline
                blocks={currentBlocks}
                wakeTime={timelineWake}
                sleepTime={timelineSleep}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Tab Component ───────────────────────────────────────────────────────

export function DailyScheduleMakerTab() {
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  return (
    <div className="space-y-5">
      {/* Mode Toggle */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{
          background: "oklch(var(--muted) / 0.4)",
          border: "1px solid oklch(var(--border))",
        }}
      >
        <button
          type="button"
          onClick={() => setMode("ai")}
          data-ocid="schedule.daily.ai_mode.toggle"
          className="px-4 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all"
          style={{
            background: mode === "ai" ? "oklch(var(--card))" : "transparent",
            color:
              mode === "ai"
                ? "oklch(var(--primary))"
                : "oklch(var(--muted-foreground))",
            boxShadow: mode === "ai" ? "0 1px 4px oklch(0 0 0 / 0.1)" : "none",
          }}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            AI Daily Planner
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          data-ocid="schedule.daily.manual_mode.toggle"
          className="px-4 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all"
          style={{
            background:
              mode === "manual" ? "oklch(var(--card))" : "transparent",
            color:
              mode === "manual"
                ? "oklch(var(--primary))"
                : "oklch(var(--muted-foreground))",
            boxShadow:
              mode === "manual" ? "0 1px 4px oklch(0 0 0 / 0.1)" : "none",
          }}
        >
          <span className="flex items-center gap-1.5">
            <PenLine className="w-3 h-3" />
            Manual Daily Planner
          </span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: mode === "ai" ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: mode === "ai" ? 12 : -12 }}
          transition={{ duration: 0.2 }}
        >
          {mode === "ai" ? <AIDailyPlanner /> : <ManualDailyPlanner />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
