import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  CalendarDays,
  Clock,
  Crown,
  Flame,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { CA_Level } from "../backend.d";
import { QuoteWidget } from "../components/QuoteWidget";
import { LEVEL_LABELS } from "../data/subjects";
import {
  useChapterProgress,
  useStudySessions,
  useTimerSessions,
  useUserProfile,
} from "../hooks/useQueries";

interface DashboardPageProps {
  onNavigate: (
    page:
      | "timer"
      | "schedule"
      | "progress"
      | "pdf"
      | "library"
      | "quotes"
      | "community",
  ) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: studySessions = [] } = useStudySessions();
  const { data: timerSessions = [] } = useTimerSessions();
  const { data: chapterProgress = [] } = useChapterProgress();

  // Weekly study hours (all logged sessions)
  const weeklyMinutes = studySessions.reduce((acc, s) => {
    return acc + Number(s.durationMins);
  }, 0);
  const weeklyHours = (weeklyMinutes / 60).toFixed(1);

  // Chapters completed
  const completedChapters = chapterProgress.filter((c) => c.completed).length;

  // Subjects with at least one chapter progressed
  const uniqueSubjectsTracked = new Set(chapterProgress.map((p) => p.subject))
    .size;

  // ---- Study Streak Calculations ----
  // Timestamps are stored as nanoseconds (BigInt), convert to ms by dividing by 1_000_000
  const todayStr = new Date().toDateString();

  // Check if studied today
  const studiedToday = studySessions.some(
    (s) =>
      new Date(Number(s.timestamp) / 1_000_000).toDateString() === todayStr,
  );

  // All unique study days as Date strings
  const allStudyDays = new Set(
    studySessions.map((s) =>
      new Date(Number(s.timestamp) / 1_000_000).toDateString(),
    ),
  );

  // Calculate consecutive streak (counting backward from today)
  const calcConsecutiveStreak = (): number => {
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (allStudyDays.has(cursor.toDateString())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  };

  // Calculate longest streak from all session data
  const calcLongestStreak = (): number => {
    if (allStudyDays.size === 0) return 0;
    const sortedDays = Array.from(allStudyDays)
      .map((d) => new Date(d).getTime())
      .sort((a, b) => a - b);
    let longest = 1;
    let current = 1;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    for (let i = 1; i < sortedDays.length; i++) {
      if (sortedDays[i] - sortedDays[i - 1] === ONE_DAY) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 1;
      }
    }
    return longest;
  };

  // Week dots: Mon-Sun of the current calendar week
  const getWeekDots = (): boolean[] => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // Monday-based week
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return allStudyDays.has(day.toDateString());
    });
  };

  const consecutiveStreak = calcConsecutiveStreak();
  const longestStreak = calcLongestStreak();
  const weekDots = getWeekDots();
  const studyDaysThisWeek = weekDots.filter(Boolean).length;

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
            label: "Hours Studied",
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
            label: "Subjects Tracked",
            value: uniqueSubjectsTracked,
            sub: "with chapter progress",
            icon: Flame,
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
        {/* Study Streak */}
        <motion.div variants={itemVariants}>
          <Card
            data-ocid="dashboard.streak.card"
            style={{
              background: "oklch(var(--card))",
              borderColor: "oklch(var(--border))",
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Flame
                    className="w-4 h-4"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                  Study Streak
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* Studied today indicator */}
                  <span
                    className="text-[10px] font-bold font-heading px-2 py-0.5 rounded-full"
                    style={{
                      background: studiedToday
                        ? "oklch(0.75 0.18 145 / 0.15)"
                        : "oklch(0.75 0.18 75 / 0.12)",
                      color: studiedToday
                        ? "oklch(0.55 0.2 145)"
                        : "oklch(0.6 0.15 75)",
                      border: studiedToday
                        ? "1px solid oklch(0.75 0.18 145 / 0.35)"
                        : "1px solid oklch(0.75 0.18 75 / 0.3)",
                    }}
                  >
                    {studiedToday ? "✓ Today" : "○ Not yet"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate("progress")}
                    className="text-xs font-heading h-7"
                    style={{ color: "oklch(var(--primary))" }}
                  >
                    View
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {allStudyDays.size === 0 ? (
                <div
                  className="text-center py-6 rounded-lg"
                  style={{
                    background: "oklch(var(--muted) / 0.5)",
                    border: "1px dashed oklch(var(--border))",
                  }}
                  data-ocid="dashboard.streak.empty_state"
                >
                  <Flame
                    className="w-8 h-8 mx-auto mb-2"
                    style={{ color: "oklch(var(--muted-foreground))" }}
                  />
                  <p className="text-sm text-muted-foreground font-heading">
                    No study sessions yet
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
                <div className="space-y-4">
                  {/* Main streak numbers */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
                      style={{
                        background: "oklch(var(--primary) / 0.12)",
                        border: "1px solid oklch(var(--primary) / 0.25)",
                      }}
                    >
                      <span
                        className="text-3xl font-bold font-display leading-none"
                        style={{ color: "oklch(var(--primary))" }}
                      >
                        {consecutiveStreak}
                      </span>
                      <span
                        className="text-[9px] font-heading uppercase tracking-wide mt-0.5"
                        style={{ color: "oklch(var(--primary) / 0.7)" }}
                      >
                        days
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-heading font-semibold text-foreground">
                        {consecutiveStreak === 0
                          ? "Start your streak today!"
                          : consecutiveStreak === 1
                            ? "1-day streak — keep going!"
                            : `${consecutiveStreak}-day streak 🔥`}
                      </p>
                      <p className="text-xs text-muted-foreground font-heading mt-0.5">
                        Consecutive days studied
                      </p>
                      {/* Longest streak */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span
                          className="text-[10px] font-heading px-1.5 py-0.5 rounded"
                          style={{
                            background: "oklch(var(--muted))",
                            color: "oklch(var(--muted-foreground))",
                          }}
                        >
                          Best: {longestStreak} day
                          {longestStreak !== 1 ? "s" : ""}
                        </span>
                        <span
                          className="text-[10px] font-heading"
                          style={{ color: "oklch(var(--muted-foreground))" }}
                        >
                          · {studyDaysThisWeek}/7 this week
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Week dots — Mon to Sun of current week */}
                  <div>
                    <div className="flex gap-1">
                      {(
                        [
                          "Mon",
                          "Tue",
                          "Wed",
                          "Thu",
                          "Fri",
                          "Sat",
                          "Sun",
                        ] as const
                      ).map((day, i) => (
                        <div
                          key={day}
                          className="flex-1 flex flex-col items-center gap-1"
                        >
                          <div
                            className="w-full h-2.5 rounded-full transition-all"
                            style={{
                              background: weekDots[i]
                                ? "oklch(var(--primary))"
                                : "oklch(var(--muted))",
                              opacity: weekDots[i] ? 1 : 0.4,
                            }}
                          />
                          <span
                            className="text-[9px] font-heading"
                            style={{
                              color: weekDots[i]
                                ? "oklch(var(--primary))"
                                : "oklch(var(--muted-foreground))",
                            }}
                          >
                            {day[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-heading text-muted-foreground mt-1">
                      This week (Mon → Sun)
                    </p>
                  </div>
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
              icon: CalendarDays,
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

      {/* Daily Quote Widget */}
      <motion.div variants={itemVariants}>
        <QuoteWidget onNavigate={() => onNavigate("quotes")} />
      </motion.div>
    </motion.div>
  );
}
