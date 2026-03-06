import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Calendar,
  Clock,
  Crown,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { CA_Level } from "../backend.d";
import { LEVEL_LABELS } from "../data/subjects";
import {
  useChapterProgress,
  useStudySessions,
  useTimerSessions,
  useTimetable,
  useUserProfile,
} from "../hooks/useQueries";

interface DashboardPageProps {
  onNavigate: (
    page: "timer" | "schedule" | "progress" | "pdf" | "library",
  ) => void;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: studySessions = [] } = useStudySessions();
  const { data: timerSessions = [] } = useTimerSessions();
  const { data: timetable = [] } = useTimetable();
  const { data: chapterProgress = [] } = useChapterProgress();

  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  // Weekly study hours (last 7 days)
  const weeklyMinutes = studySessions.reduce((acc, s) => {
    return acc + Number(s.durationMins);
  }, 0);
  const weeklyHours = (weeklyMinutes / 60).toFixed(1);

  // Chapters completed
  const completedChapters = chapterProgress.filter((c) => c.completed).length;

  // Today's timetable
  const todaySlots = timetable
    .filter((s) => s.dayOfWeek === today)
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 4);

  // Recent timer sessions
  const recentSessions = timerSessions.slice(0, 5);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const activeLevel =
    (localStorage.getItem("ca-active-level") as CA_Level) ||
    CA_Level.intermediate;

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
      className="p-6 max-w-6xl mx-auto space-y-6"
    >
      {/* Hero Welcome */}
      <motion.div
        variants={itemVariants}
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(var(--card)), oklch(var(--accent) / 0.3))",
          border: "1px solid oklch(var(--border))",
        }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 opacity-5"
          style={{
            background:
              "radial-gradient(circle, oklch(var(--primary)), transparent)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p
              className="text-sm font-heading"
              style={{ color: "oklch(var(--primary))" }}
            >
              {greeting()},
            </p>
            {profileLoading ? (
              <Skeleton className="h-9 w-48 mt-1" />
            ) : (
              <h1 className="font-display text-3xl font-bold text-foreground mt-0.5">
                {profile?.name || "CA Scholar"}
              </h1>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="secondary"
                className="font-heading text-xs"
                style={{
                  background: "oklch(var(--primary) / 0.15)",
                  color: "oklch(var(--primary))",
                  border: "1px solid oklch(var(--primary) / 0.3)",
                }}
              >
                <Crown className="w-3 h-3 mr-1" />
                CA {LEVEL_LABELS[activeLevel]}
              </Badge>
              <span className="text-xs text-muted-foreground font-heading">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
          </div>
          <Button
            onClick={() => onNavigate("timer")}
            className="hidden sm:flex items-center gap-2 font-heading font-semibold"
            style={{
              background: "oklch(var(--primary))",
              color: "oklch(var(--primary-foreground))",
              boxShadow: "0 4px 16px oklch(var(--primary) / 0.3)",
            }}
            data-ocid="dashboard.timer.primary_button"
          >
            <Zap className="w-4 h-4" />
            Start Studying
          </Button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Hours This Week",
            value: weeklyHours,
            sub: "total study time",
            icon: Clock,
            color: "var(--chart-1)",
          },
          {
            label: "Chapters Done",
            value: completedChapters,
            sub: "across all subjects",
            icon: BookOpen,
            color: "var(--chart-2)",
          },
          {
            label: "Sessions",
            value: timerSessions.length,
            sub: "timer sessions logged",
            icon: Timer,
            color: "var(--chart-3)",
          },
          {
            label: "Today's Slots",
            value: todaySlots.length,
            sub: `scheduled for ${today}`,
            icon: Calendar,
            color: "var(--chart-4)",
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="border"
            style={{
              background: "oklch(var(--card))",
              borderColor: "oklch(var(--border))",
            }}
          >
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-heading text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `oklch(${stat.color} / 0.15)` }}
                >
                  <stat.icon
                    className="w-3.5 h-3.5"
                    style={{ color: `oklch(${stat.color})` }}
                  />
                </div>
              </div>
              <div
                className="text-2xl font-bold font-display"
                style={{ color: `oklch(${stat.color})` }}
              >
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-heading">
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Two column */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Timetable */}
        <motion.div variants={itemVariants}>
          <Card
            style={{
              background: "oklch(var(--card))",
              borderColor: "oklch(var(--border))",
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Calendar
                    className="w-4 h-4"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                  Today&apos;s Schedule
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("schedule")}
                  className="text-xs font-heading h-7"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todaySlots.length === 0 ? (
                <div
                  className="text-center py-6 rounded-lg"
                  style={{
                    background: "oklch(var(--muted) / 0.5)",
                    border: "1px dashed oklch(var(--border))",
                  }}
                >
                  <Calendar
                    className="w-8 h-8 mx-auto mb-2"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  />
                  <p className="text-sm text-muted-foreground font-heading">
                    No slots scheduled for today
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onNavigate("schedule")}
                    className="text-xs mt-1"
                    style={{ color: "oklch(var(--primary))" }}
                  >
                    Create schedule
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {todaySlots.map((slot, i) => (
                    <div
                      key={slot.slotId}
                      className="flex items-center gap-3 p-2.5 rounded-lg"
                      style={{
                        background:
                          i === 0
                            ? "oklch(var(--primary) / 0.08)"
                            : "oklch(var(--muted) / 0.4)",
                        border: `1px solid ${i === 0 ? "oklch(var(--primary) / 0.2)" : "oklch(var(--border))"}`,
                      }}
                    >
                      <div
                        className="text-xs font-heading font-bold px-2 py-1 rounded"
                        style={{
                          background: "oklch(var(--primary) / 0.15)",
                          color: "oklch(var(--primary))",
                        }}
                      >
                        {slot.time}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-heading font-medium text-foreground truncate">
                          {slot.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {LEVEL_LABELS[slot.caLevel]}
                        </p>
                      </div>
                      {i === 0 && (
                        <Badge
                          className="text-xs font-heading"
                          style={{
                            background: "oklch(var(--primary) / 0.2)",
                            color: "oklch(var(--primary))",
                            border: "none",
                          }}
                        >
                          Next
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Sessions */}
        <motion.div variants={itemVariants}>
          <Card
            style={{
              background: "oklch(var(--card))",
              borderColor: "oklch(var(--border))",
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <TrendingUp
                    className="w-4 h-4"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                  Recent Sessions
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("timer")}
                  className="text-xs font-heading h-7"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  Start New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <div
                  className="text-center py-6 rounded-lg"
                  style={{
                    background: "oklch(var(--muted) / 0.5)",
                    border: "1px dashed oklch(var(--border))",
                  }}
                >
                  <Timer
                    className="w-8 h-8 mx-auto mb-2"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  />
                  <p className="text-sm text-muted-foreground font-heading">
                    No timer sessions yet
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onNavigate("timer")}
                    className="text-xs mt-1"
                    style={{ color: "oklch(var(--primary))" }}
                  >
                    Start your first session
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((s) => (
                    <div
                      key={s.timerId}
                      className="flex items-center gap-3 p-2.5 rounded-lg"
                      style={{
                        background: "oklch(var(--muted) / 0.4)",
                        border: "1px solid oklch(var(--border))",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "oklch(var(--primary) / 0.1)",
                        }}
                      >
                        <Timer
                          className="w-4 h-4"
                          style={{ color: "oklch(var(--primary))" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-heading font-medium text-foreground truncate">
                          {s.subject}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {s.timerType} • {LEVEL_LABELS[s.caLevel]}
                        </p>
                      </div>
                      <span
                        className="text-sm font-bold font-heading"
                        style={{ color: "oklch(var(--primary))" }}
                      >
                        {Number(s.durationMins)}m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Start Timer",
              icon: Timer,
              page: "timer" as const,
              color: "var(--primary)",
            },
            {
              label: "Schedule Maker",
              icon: Calendar,
              page: "schedule" as const,
              color: "var(--chart-2)",
            },
            {
              label: "Track Progress",
              icon: TrendingUp,
              page: "progress" as const,
              color: "var(--chart-3)",
            },
            {
              label: "My Library",
              icon: BookOpen,
              page: "library" as const,
              color: "var(--chart-4)",
            },
          ].map((action) => (
            <button
              type="button"
              key={action.label}
              onClick={() => onNavigate(action.page)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `oklch(${action.color} / 0.08)`,
                border: `1px solid oklch(${action.color} / 0.2)`,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `oklch(${action.color} / 0.15)` }}
              >
                <action.icon
                  className="w-5 h-5"
                  style={{ color: `oklch(${action.color})` }}
                />
              </div>
              <span
                className="text-sm font-heading font-medium"
                style={{ color: `oklch(${action.color})` }}
              >
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
