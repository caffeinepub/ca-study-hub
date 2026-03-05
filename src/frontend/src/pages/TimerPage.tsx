import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  Clock,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Save,
  Timer,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CA_Level, Variant_stopwatch_pomodoro } from "../backend.d";
import { CA_SUBJECTS, LEVEL_LABELS } from "../data/subjects";
import {
  useAddTimerSession,
  useLogStudySession,
  useTimerSessions,
} from "../hooks/useQueries";
import { nanoid } from "../utils/nanoid";

type TimerMode = "pomodoro" | "stopwatch";
type PomodoroPhase = "work" | "shortBreak" | "longBreak";

const POMODORO_DURATIONS: Record<PomodoroPhase, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  work: "Focus Time",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  work: "var(--primary)",
  shortBreak: "var(--chart-2)",
  longBreak: "var(--chart-3)",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimerPage() {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [phase, setPhase] = useState<PomodoroPhase>("work");
  const [cycleCount, _setCycleCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(POMODORO_DURATIONS.work);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CA_Level>(
    CA_Level.intermediate,
  );
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: sessions = [], isLoading: sessionsLoading } =
    useTimerSessions();
  const addTimer = useAddTimerSession();
  const logStudy = useLogStudySession();

  const subjects = CA_SUBJECTS.filter((s) => s.level === selectedLevel);

  const totalDuration = mode === "pomodoro" ? POMODORO_DURATIONS[phase] : 0;
  const progress =
    mode === "pomodoro" && totalDuration > 0
      ? ((totalDuration - timeLeft) / totalDuration) * 100
      : 0;

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (mode === "pomodoro") {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval_();
              setRunning(false);
              toast.success(`${PHASE_LABELS[phase]} complete! 🎉`);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setElapsed((prev) => prev + 1);
        }
      }, 1000);
    } else {
      clearInterval_();
    }
    return clearInterval_;
  }, [running, mode, phase, clearInterval_]);

  const handleStart = () => setRunning(true);
  const handlePause = () => setRunning(false);

  const handleReset = () => {
    setRunning(false);
    if (mode === "pomodoro") {
      setTimeLeft(POMODORO_DURATIONS[phase]);
    } else {
      setElapsed(0);
    }
  };

  const handleSave = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject first");
      return;
    }
    const durationMins =
      mode === "pomodoro"
        ? BigInt(Math.floor((totalDuration - timeLeft) / 60))
        : BigInt(Math.floor(elapsed / 60));

    if (durationMins <= 0n) {
      toast.error("No time recorded yet. Start the timer first.");
      return;
    }

    const now = BigInt(Date.now()) * 1_000_000n;
    const timerId = nanoid();
    const sessionId = nanoid();

    try {
      await Promise.all([
        addTimer.mutateAsync({
          timerId,
          subject: selectedSubject,
          caLevel: selectedLevel,
          timerType:
            mode === "pomodoro"
              ? Variant_stopwatch_pomodoro.pomodoro
              : Variant_stopwatch_pomodoro.stopwatch,
          durationMins,
        }),
        logStudy.mutateAsync({
          sessionId,
          subject: selectedSubject,
          caLevel: selectedLevel,
          durationMins,
          timestamp: now,
        }),
      ]);
      toast.success(
        `Session saved! ${Number(durationMins)} min of ${selectedSubject}`,
      );
      setRunning(false);
      if (mode === "pomodoro") {
        setTimeLeft(POMODORO_DURATIONS[phase]);
      } else {
        setElapsed(0);
      }
    } catch {
      toast.error("Failed to save session");
    }
  };

  const switchPhase = (newPhase: PomodoroPhase) => {
    setPhase(newPhase);
    setTimeLeft(POMODORO_DURATIONS[newPhase]);
    setRunning(false);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setRunning(false);
    setTimeLeft(POMODORO_DURATIONS.work);
    setElapsed(0);
    setPhase("work");
  };

  // SVG circle
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);
  const currentColor =
    mode === "pomodoro" ? PHASE_COLORS[phase] : "var(--primary)";

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Study Timer
          </h2>
          <p className="text-sm text-muted-foreground font-heading mt-0.5">
            Track your focused study sessions
          </p>
        </div>

        {/* Mode Switch */}
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{
            background: "oklch(var(--muted) / 0.5)",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <button
            type="button"
            data-ocid="timer.pomodoro.tab"
            onClick={() => switchMode("pomodoro")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-medium transition-all"
            style={{
              background:
                mode === "pomodoro" ? "oklch(var(--card))" : "transparent",
              color:
                mode === "pomodoro"
                  ? "oklch(var(--foreground))"
                  : "oklch(var(--muted-foreground))",
              boxShadow:
                mode === "pomodoro" ? "0 1px 4px oklch(0 0 0 / 0.15)" : "none",
            }}
          >
            <Timer className="w-4 h-4" />
            Pomodoro
          </button>
          <button
            type="button"
            data-ocid="timer.stopwatch.tab"
            onClick={() => switchMode("stopwatch")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading font-medium transition-all"
            style={{
              background:
                mode === "stopwatch" ? "oklch(var(--card))" : "transparent",
              color:
                mode === "stopwatch"
                  ? "oklch(var(--foreground))"
                  : "oklch(var(--muted-foreground))",
              boxShadow:
                mode === "stopwatch" ? "0 1px 4px oklch(0 0 0 / 0.15)" : "none",
            }}
          >
            <Clock className="w-4 h-4" />
            Stopwatch
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Timer Display */}
          <div
            className="rounded-2xl p-6 flex flex-col items-center"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
            }}
          >
            {/* Pomodoro Phase Tabs */}
            <AnimatePresence mode="wait">
              {mode === "pomodoro" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex gap-1 mb-5"
                >
                  {(["work", "shortBreak", "longBreak"] as PomodoroPhase[]).map(
                    (p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => switchPhase(p)}
                        className="px-3 py-1 rounded-lg text-xs font-heading font-medium transition-all"
                        style={{
                          background:
                            phase === p
                              ? `oklch(${PHASE_COLORS[p]} / 0.15)`
                              : "transparent",
                          color:
                            phase === p
                              ? `oklch(${PHASE_COLORS[p]})`
                              : "oklch(var(--muted-foreground))",
                          border: `1px solid ${phase === p ? `oklch(${PHASE_COLORS[p]} / 0.3)` : "transparent"}`,
                        }}
                      >
                        {p === "work"
                          ? "Focus"
                          : p === "shortBreak"
                            ? "Short Break"
                            : "Long Break"}
                      </button>
                    ),
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Circle Timer */}
            <div className="relative flex items-center justify-center mb-6">
              <svg
                width="260"
                height="260"
                viewBox="0 0 260 260"
                aria-label="Timer progress"
              >
                <title>Timer progress</title>
                {/* Background circle */}
                <circle
                  cx="130"
                  cy="130"
                  r={radius}
                  fill="none"
                  stroke="oklch(var(--border))"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                {mode === "pomodoro" && (
                  <circle
                    cx="130"
                    cy="130"
                    r={radius}
                    fill="none"
                    stroke={`oklch(${currentColor})`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="timer-circle"
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                  />
                )}
                {/* Glow circle for stopwatch */}
                {mode === "stopwatch" && running && (
                  <circle
                    cx="130"
                    cy="130"
                    r={radius}
                    fill="none"
                    stroke={`oklch(${currentColor} / 0.3)`}
                    strokeWidth="12"
                    className="animate-timer-pulse"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="font-display text-5xl font-bold tabular-nums"
                  style={{ color: `oklch(${currentColor})` }}
                >
                  {mode === "pomodoro"
                    ? formatTime(timeLeft)
                    : formatTime(elapsed)}
                </span>
                <span className="text-xs text-muted-foreground font-heading mt-1">
                  {mode === "pomodoro"
                    ? PHASE_LABELS[phase]
                    : running
                      ? "Running..."
                      : "Stopwatch"}
                </span>
                {mode === "pomodoro" && cycleCount > 0 && (
                  <span
                    className="text-xs font-heading mt-1"
                    style={{ color: `oklch(${currentColor})` }}
                  >
                    Cycle {cycleCount}
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                data-ocid="timer.reset.button"
                className="w-11 h-11 rounded-full border-border"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              {running ? (
                <Button
                  onClick={handlePause}
                  data-ocid="timer.pause.button"
                  className="w-16 h-16 rounded-full text-lg"
                  style={{
                    background: `oklch(${currentColor})`,
                    color: "oklch(var(--primary-foreground))",
                    boxShadow: `0 4px 20px oklch(${currentColor} / 0.4)`,
                  }}
                >
                  <Pause className="w-6 h-6" />
                </Button>
              ) : (
                <Button
                  onClick={handleStart}
                  data-ocid="timer.start.button"
                  className="w-16 h-16 rounded-full text-lg"
                  style={{
                    background: `oklch(${currentColor})`,
                    color: "oklch(var(--primary-foreground))",
                    boxShadow: `0 4px 20px oklch(${currentColor} / 0.4)`,
                  }}
                >
                  <Play className="w-6 h-6 ml-0.5" />
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={handleSave}
                disabled={addTimer.isPending || logStudy.isPending}
                data-ocid="timer.save.button"
                className="w-11 h-11 rounded-full border-border"
              >
                {addTimer.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Subject Selection & Sessions */}
          <div className="space-y-4">
            {/* Subject Picker */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "oklch(var(--card))",
                border: "1px solid oklch(var(--border))",
              }}
            >
              <h3 className="text-sm font-heading font-semibold text-foreground mb-3">
                Session Details
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-heading text-muted-foreground mb-1.5">
                    CA Level
                  </p>
                  <Select
                    value={selectedLevel}
                    onValueChange={(v) => {
                      setSelectedLevel(v as CA_Level);
                      setSelectedSubject("");
                    }}
                  >
                    <SelectTrigger
                      className="h-9 text-sm font-heading"
                      data-ocid="timer.subject.select"
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

                <div>
                  <p className="text-xs font-heading text-muted-foreground mb-1.5">
                    Subject
                  </p>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                    disabled={subjects.length === 0}
                  >
                    <SelectTrigger className="h-9 text-sm font-heading">
                      <SelectValue placeholder="Select subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem
                          key={s.code}
                          value={s.name}
                          className="font-heading text-sm"
                        >
                          <span className="text-xs text-muted-foreground mr-1">
                            [{s.code}]
                          </span>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={addTimer.isPending || !selectedSubject}
                  className="w-full h-9 font-heading font-semibold text-sm"
                  style={{
                    background: "oklch(var(--primary))",
                    color: "oklch(var(--primary-foreground))",
                  }}
                  data-ocid="timer.save.button"
                >
                  {addTimer.isPending ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 w-4 h-4" />
                      Save Session
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Session History */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "oklch(var(--card))",
                border: "1px solid oklch(var(--border))",
              }}
            >
              <h3 className="text-sm font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <ChevronDown
                  className="w-4 h-4"
                  style={{ color: "oklch(var(--primary))" }}
                />
                Session History
              </h3>
              {sessionsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground font-heading py-4 text-center">
                  No sessions yet. Start studying!
                </p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {sessions.map((s, i) => (
                    <div
                      key={s.timerId}
                      className="flex items-center gap-3 p-2.5 rounded-lg"
                      style={{
                        background: "oklch(var(--muted) / 0.4)",
                        border: "1px solid oklch(var(--border))",
                      }}
                      data-ocid={`timer.session.item.${i + 1}`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{
                          background: "oklch(var(--primary) / 0.1)",
                          color: "oklch(var(--primary))",
                        }}
                      >
                        {Number(s.durationMins)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-heading font-medium text-foreground truncate">
                          {s.subject}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {s.timerType} • {LEVEL_LABELS[s.caLevel]}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs font-heading"
                        style={{
                          background: "oklch(var(--primary) / 0.1)",
                          color: "oklch(var(--primary))",
                        }}
                      >
                        {Number(s.durationMins)}m
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
