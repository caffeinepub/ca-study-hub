import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  Clock,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Save,
  Settings2,
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

// ── Timer colour accent definitions ─────────────────────────────────────────
const COLOR_PRESETS = [
  { id: "royal", label: "Royal", value: "var(--primary)" },
  { id: "rose", label: "Rose", oklch: "0.65 0.22 10" },
  { id: "teal", label: "Teal", oklch: "0.62 0.14 185" },
  { id: "amber", label: "Amber", oklch: "0.75 0.17 65" },
  { id: "violet", label: "Violet", oklch: "0.62 0.22 295" },
] as const;

type ColorPresetId = (typeof COLOR_PRESETS)[number]["id"];

// ── Persisted settings ───────────────────────────────────────────────────────
interface TimerSettings {
  focusMins: number;
  shortBreakMins: number;
  longBreakMins: number;
  longBreakAfter: number; // cycles before long break
  autoStart: boolean;
  soundEnabled: boolean;
  colorAccent: ColorPresetId;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusMins: 25,
  shortBreakMins: 5,
  longBreakMins: 15,
  longBreakAfter: 4,
  autoStart: false,
  soundEnabled: true,
  colorAccent: "royal",
};

const SETTINGS_KEY = "ca_timer_settings";

function loadSettings(): TimerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: TimerSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getColorString(id: ColorPresetId): string {
  const preset = COLOR_PRESETS.find((c) => c.id === id);
  if (!preset) return "var(--primary)";
  if ("oklch" in preset) return preset.oklch;
  return preset.value;
}

function sendNotification(title: string, body: string): void {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

// ── Colour dot chip ──────────────────────────────────────────────────────────
function ColorChip({
  preset,
  active,
  index,
  onClick,
}: {
  preset: (typeof COLOR_PRESETS)[number];
  active: boolean;
  index: number;
  onClick: () => void;
}) {
  const colorVal =
    "oklch" in preset
      ? `oklch(${preset.oklch})`
      : `oklch(${getColorString(preset.id)})`;

  return (
    <button
      type="button"
      data-ocid={`timer.customize.color.${index + 1}`}
      onClick={onClick}
      title={preset.label}
      className="relative w-8 h-8 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        background: colorVal,
        boxShadow: active
          ? `0 0 0 2px oklch(var(--card)), 0 0 0 4px ${colorVal}`
          : "none",
        transform: active ? "scale(1.15)" : "scale(1)",
      }}
      aria-label={`${preset.label} colour accent${active ? " (active)" : ""}`}
      aria-pressed={active}
    >
      {active && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-white/70" />
        </span>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function TimerPage() {
  const [settings, setSettings] = useState<TimerSettings>(loadSettings);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [phase, setPhase] = useState<PomodoroPhase>("work");
  const [cycleCount, setCycleCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.focusMins * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CA_Level>(
    CA_Level.intermediate,
  );
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pending settings while timer is running (applied on next reset)
  const pendingSettingsRef = useRef<TimerSettings | null>(null);

  const { data: sessions = [], isLoading: sessionsLoading } =
    useTimerSessions();
  const addTimer = useAddTimerSession();
  const logStudy = useLogStudySession();

  const subjects = CA_SUBJECTS.filter((s) => s.level === selectedLevel);

  // Compute phase durations from settings
  const phaseDurations: Record<PomodoroPhase, number> = {
    work: settings.focusMins * 60,
    shortBreak: settings.shortBreakMins * 60,
    longBreak: settings.longBreakMins * 60,
  };

  const totalDuration = mode === "pomodoro" ? phaseDurations[phase] : 0;
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

  // Colour accent
  const currentColorRaw = getColorString(settings.colorAccent);
  const currentColorCss =
    currentColorRaw.startsWith("var(") || currentColorRaw.startsWith("oklch(")
      ? currentColorRaw
      : `oklch(${currentColorRaw})`;
  // Glow colour: strip oklch() wrapper if present, then re-wrap with alpha
  const innerColorVal = currentColorRaw.startsWith("var(")
    ? "var(--primary)"
    : currentColorRaw;
  const glowCss = `oklch(${innerColorVal} / 0.4)`;

  // ── Timer tick + session-complete logic ──────────────────────────────────
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (mode === "pomodoro") {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval_();
              setRunning(false);

              // Notification
              if (settings.soundEnabled) {
                const label =
                  phase === "work"
                    ? "Focus Time"
                    : phase === "shortBreak"
                      ? "Short Break"
                      : "Long Break";
                sendNotification("CA Study Hub", `${label} complete! 🎉`);
              }

              toast.success(
                `${phase === "work" ? "Focus" : phase === "shortBreak" ? "Short Break" : "Long Break"} complete! 🎉`,
              );

              // Increment cycle count + auto-transition
              if (phase === "work") {
                setCycleCount((prev) => {
                  const next = prev + 1;
                  if (settings.autoStart) {
                    const nextPhase =
                      next % settings.longBreakAfter === 0
                        ? "longBreak"
                        : "shortBreak";
                    // Schedule phase switch after state settles
                    setTimeout(() => {
                      setPhase(nextPhase);
                      setTimeLeft(
                        nextPhase === "longBreak"
                          ? settings.longBreakMins * 60
                          : settings.shortBreakMins * 60,
                      );
                      setRunning(true);
                    }, 500);
                  }
                  return next;
                });
              } else {
                // Break finished → back to work
                if (settings.autoStart) {
                  setTimeout(() => {
                    setPhase("work");
                    setTimeLeft(settings.focusMins * 60);
                    setRunning(true);
                  }, 500);
                }
              }

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
  }, [running, mode, phase, settings, clearInterval_]);

  const handleStart = () => setRunning(true);
  const handlePause = () => setRunning(false);

  const handleReset = () => {
    setRunning(false);
    // Apply any pending settings change
    if (pendingSettingsRef.current) {
      const s = pendingSettingsRef.current;
      pendingSettingsRef.current = null;
      setSettings(s);
      saveSettings(s);
      setTimeLeft(s.focusMins * 60);
    } else if (mode === "pomodoro") {
      setTimeLeft(phaseDurations[phase]);
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
        setTimeLeft(phaseDurations[phase]);
      } else {
        setElapsed(0);
      }
    } catch {
      toast.error("Failed to save session");
    }
  };

  const switchPhase = (newPhase: PomodoroPhase) => {
    setPhase(newPhase);
    setTimeLeft(phaseDurations[newPhase]);
    setRunning(false);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setRunning(false);
    setTimeLeft(phaseDurations.work);
    setElapsed(0);
    setPhase("work");
  };

  // ── Settings updater ────────────────────────────────────────────────────
  const updateSettings = (patch: Partial<TimerSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (running) {
        // Queue for next reset
        pendingSettingsRef.current = next;
      } else {
        saveSettings(next);
        // Update timeLeft if duration changed and timer not running
        if (patch.focusMins !== undefined && phase === "work") {
          setTimeLeft(patch.focusMins * 60);
        }
        if (patch.shortBreakMins !== undefined && phase === "shortBreak") {
          setTimeLeft(patch.shortBreakMins * 60);
        }
        if (patch.longBreakMins !== undefined && phase === "longBreak") {
          setTimeLeft(patch.longBreakMins * 60);
        }
      }
      return next;
    });
  };

  // ── Notification permission ─────────────────────────────────────────────
  const requestNotifPermission = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  // ── SVG circle ──────────────────────────────────────────────────────────
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

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

        {/* ── Customize Panel ─────────────────────────────────────────────── */}
        <Collapsible open={customizeOpen} onOpenChange={setCustomizeOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              data-ocid="timer.customize.toggle"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-heading font-medium transition-all w-fit"
              style={{
                background: customizeOpen
                  ? "oklch(var(--card))"
                  : "oklch(var(--muted) / 0.5)",
                border: "1px solid oklch(var(--border))",
                color: customizeOpen
                  ? currentColorCss
                  : "oklch(var(--muted-foreground))",
              }}
            >
              <Settings2 className="w-4 h-4" />
              Customize Timer
              <ChevronDown
                className="w-4 h-4 transition-transform duration-200"
                style={{
                  transform: customizeOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent data-ocid="timer.customize.panel">
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 rounded-2xl p-5 space-y-5"
              style={{
                background: "oklch(var(--card))",
                border: "1px solid oklch(var(--border))",
              }}
            >
              {/* ── Duration sliders ───────────────────────────────── */}
              <div>
                <h4 className="text-sm font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Timer
                    className="w-4 h-4"
                    style={{ color: currentColorCss }}
                  />
                  Pomodoro Durations
                </h4>
                <div className="space-y-5">
                  {/* Focus Duration */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-heading text-muted-foreground">
                        Focus Duration
                      </Label>
                      <span
                        className="text-sm font-heading font-semibold tabular-nums"
                        style={{ color: currentColorCss }}
                      >
                        {settings.focusMins} min
                      </span>
                    </div>
                    <Slider
                      data-ocid="timer.customize.focus_input"
                      min={1}
                      max={60}
                      step={1}
                      value={[settings.focusMins]}
                      onValueChange={([v]) => updateSettings({ focusMins: v })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground font-heading">
                      <span>1 min</span>
                      <span>60 min</span>
                    </div>
                  </div>

                  {/* Short Break */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-heading text-muted-foreground">
                        Short Break
                      </Label>
                      <span
                        className="text-sm font-heading font-semibold tabular-nums"
                        style={{ color: currentColorCss }}
                      >
                        {settings.shortBreakMins} min
                      </span>
                    </div>
                    <Slider
                      data-ocid="timer.customize.short_break_input"
                      min={1}
                      max={30}
                      step={1}
                      value={[settings.shortBreakMins]}
                      onValueChange={([v]) =>
                        updateSettings({ shortBreakMins: v })
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground font-heading">
                      <span>1 min</span>
                      <span>30 min</span>
                    </div>
                  </div>

                  {/* Long Break */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-heading text-muted-foreground">
                        Long Break
                      </Label>
                      <span
                        className="text-sm font-heading font-semibold tabular-nums"
                        style={{ color: currentColorCss }}
                      >
                        {settings.longBreakMins} min
                      </span>
                    </div>
                    <Slider
                      data-ocid="timer.customize.long_break_input"
                      min={1}
                      max={30}
                      step={1}
                      value={[settings.longBreakMins]}
                      onValueChange={([v]) =>
                        updateSettings({ longBreakMins: v })
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground font-heading">
                      <span>1 min</span>
                      <span>30 min</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                className="h-px w-full"
                style={{ background: "oklch(var(--border))" }}
              />

              {/* ── Cycle & auto-start ─────────────────────────────── */}
              <div className="space-y-4">
                {/* Long break after N cycles */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-heading text-muted-foreground">
                      Long Break After
                    </Label>
                    <span
                      className="text-sm font-heading font-semibold tabular-nums"
                      style={{ color: currentColorCss }}
                    >
                      {settings.longBreakAfter}{" "}
                      {settings.longBreakAfter === 1 ? "cycle" : "cycles"}
                    </span>
                  </div>
                  <Slider
                    data-ocid="timer.customize.cycles_input"
                    min={1}
                    max={8}
                    step={1}
                    value={[settings.longBreakAfter]}
                    onValueChange={([v]) =>
                      updateSettings({ longBreakAfter: v })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-heading">
                    <span>1 cycle</span>
                    <span>8 cycles</span>
                  </div>
                </div>

                {/* Auto-start toggle */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-heading font-medium text-foreground">
                      Auto-start next session
                    </p>
                    <p className="text-xs text-muted-foreground font-heading">
                      Automatically begin the break when focus ends
                    </p>
                  </div>
                  <Switch
                    data-ocid="timer.customize.autostart.switch"
                    checked={settings.autoStart}
                    onCheckedChange={(v) => updateSettings({ autoStart: v })}
                  />
                </div>
              </div>

              {/* Divider */}
              <div
                className="h-px w-full"
                style={{ background: "oklch(var(--border))" }}
              />

              {/* ── Sound / Notification ──────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-heading font-medium text-foreground">
                      Session notifications
                    </p>
                    <p className="text-xs text-muted-foreground font-heading">
                      Browser alert when a session ends
                    </p>
                  </div>
                  <Switch
                    data-ocid="timer.customize.sound.switch"
                    checked={settings.soundEnabled}
                    onCheckedChange={(v) => {
                      updateSettings({ soundEnabled: v });
                      if (v && notifPermission === "default") {
                        requestNotifPermission();
                      }
                    }}
                  />
                </div>

                {/* Permission warnings */}
                <AnimatePresence>
                  {settings.soundEnabled && notifPermission === "denied" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg px-3 py-2 text-xs font-heading"
                      style={{
                        background: "oklch(var(--destructive) / 0.1)",
                        border: "1px solid oklch(var(--destructive) / 0.3)",
                        color: "oklch(var(--destructive))",
                      }}
                    >
                      ⚠️ Notifications are blocked. Enable them in your browser
                      settings to receive session alerts.
                    </motion.div>
                  )}
                  {settings.soundEnabled && notifPermission === "default" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg px-3 py-2 text-xs font-heading"
                      style={{
                        background: "oklch(var(--primary) / 0.08)",
                        border: "1px solid oklch(var(--primary) / 0.25)",
                        color: "oklch(var(--foreground))",
                      }}
                    >
                      <button
                        type="button"
                        onClick={requestNotifPermission}
                        className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                        style={{ color: currentColorCss }}
                      >
                        Click to allow notifications
                      </button>{" "}
                      so you can be alerted when sessions end.
                    </motion.div>
                  )}
                  {settings.soundEnabled &&
                    notifPermission === "unsupported" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-lg px-3 py-2 text-xs font-heading text-muted-foreground"
                        style={{
                          background: "oklch(var(--muted) / 0.5)",
                          border: "1px solid oklch(var(--border))",
                        }}
                      >
                        Your browser doesn't support notifications.
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div
                className="h-px w-full"
                style={{ background: "oklch(var(--border))" }}
              />

              {/* ── Color accent ──────────────────────────────────── */}
              <div>
                <p className="text-sm font-heading font-medium text-foreground mb-3">
                  Timer Ring Colour
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  {COLOR_PRESETS.map((preset, i) => (
                    <div
                      key={preset.id}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <ColorChip
                        preset={preset}
                        active={settings.colorAccent === preset.id}
                        index={i}
                        onClick={() =>
                          updateSettings({ colorAccent: preset.id })
                        }
                      />
                      <span className="text-xs text-muted-foreground font-heading">
                        {preset.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Running-state notice */}
              <AnimatePresence>
                {running && pendingSettingsRef.current && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg px-3 py-2 text-xs font-heading"
                    style={{
                      background: "oklch(var(--primary) / 0.08)",
                      border: "1px solid oklch(var(--primary) / 0.25)",
                      color: "oklch(var(--muted-foreground))",
                    }}
                  >
                    Duration changes will apply after you reset the timer.
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

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
                              ? p === "work"
                                ? "oklch(var(--primary) / 0.15)"
                                : "oklch(var(--muted) / 0.8)"
                              : "transparent",
                          color:
                            phase === p
                              ? p === "work"
                                ? currentColorCss
                                : "oklch(var(--foreground))"
                              : "oklch(var(--muted-foreground))",
                          border:
                            phase === p
                              ? p === "work"
                                ? "1px solid oklch(var(--primary) / 0.3)"
                                : "1px solid oklch(var(--border))"
                              : "1px solid transparent",
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
                    stroke={currentColorCss}
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
                    stroke="oklch(var(--primary) / 0.3)"
                    strokeWidth="12"
                    className="animate-timer-pulse"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="font-display text-5xl font-bold tabular-nums"
                  style={{ color: currentColorCss }}
                >
                  {mode === "pomodoro"
                    ? formatTime(timeLeft)
                    : formatTime(elapsed)}
                </span>
                <span className="text-xs text-muted-foreground font-heading mt-1">
                  {mode === "pomodoro"
                    ? phase === "work"
                      ? "Focus Time"
                      : phase === "shortBreak"
                        ? "Short Break"
                        : "Long Break"
                    : running
                      ? "Running..."
                      : "Stopwatch"}
                </span>
                {mode === "pomodoro" && cycleCount > 0 && (
                  <span
                    className="text-xs font-heading mt-1"
                    style={{ color: currentColorCss }}
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
                    background: currentColorCss,
                    color: "oklch(var(--primary-foreground))",
                    boxShadow: `0 4px 20px ${glowCss}`,
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
                    background: currentColorCss,
                    color: "oklch(var(--primary-foreground))",
                    boxShadow: `0 4px 20px ${glowCss}`,
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
                  style={{ color: currentColorCss }}
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
