import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Check,
  Crown,
  GraduationCap,
  Loader2,
  LogIn,
  Moon,
  Palette,
  Save,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CA_Level } from "../backend.d";
import { CATEGORY_LABELS, type QuoteCategory } from "../data/quotes";
import { LEVEL_LABELS } from "../data/subjects";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveUserProfile, useUserProfile } from "../hooks/useQueries";
import { type AutoRotateInterval, useQuotes } from "../hooks/useQuotes";
import {
  THEME_DESCRIPTIONS,
  THEME_LABELS,
  THEME_PREVIEW_COLORS,
  type Theme,
  useTheme,
} from "../hooks/useTheme";
import { useUserStats } from "../hooks/useUserStats";

const AUTO_ROTATE_LABELS: Record<AutoRotateInterval, string> = {
  off: "Off",
  "30": "Every 30 seconds",
  "60": "Every 1 minute",
  "120": "Every 2 minutes",
  "300": "Every 5 minutes",
};

const THEMES: Theme[] = ["royal", "sunset", "anime", "cute", "lofi", "earthly"];

const THEME_OCIDS: Record<Theme, string> = {
  royal: "settings.theme.royal.button",
  sunset: "settings.theme.sunset.button",
  anime: "settings.theme.anime.button",
  cute: "settings.theme.cute.button",
  lofi: "settings.theme.lofi.button",
  earthly: "settings.theme.earthly.button",
};

export function SettingsPage() {
  const { identity, login } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const saveProfile = useSaveUserProfile();
  const { theme, setTheme, colorMode, toggleColorMode } = useTheme();
  const {
    category: quoteCategory,
    setCategory: setQuoteCategory,
    autoRotate,
    setAutoRotate,
  } = useQuotes();

  const [name, setName] = useState(
    () => profile?.name || localStorage.getItem("ca-cached-name") || "",
  );
  const [statsTab, setStatsTab] = useState<"day" | "week" | "month">("day");
  const { stats: userStats, isLoading: statsLoading } = useUserStats();

  const [activeLevel, setActiveLevel] = useState<CA_Level>(
    (localStorage.getItem("ca-active-level") as CA_Level) ||
      CA_Level.intermediate,
  );

  // Sync name when profile loads from backend — prefer backend value, fall back to cache
  useEffect(() => {
    if (profile?.name?.trim()) {
      setName(profile.name);
      // Keep cache in sync with backend
      localStorage.setItem("ca-cached-name", profile.name);
    } else {
      // No backend profile yet — try the local cache
      const cached = localStorage.getItem("ca-cached-name");
      if (cached?.trim()) {
        setName(cached);
      }
    }
  }, [profile?.name]);

  const handleSaveProfile = async () => {
    if (!identity) {
      toast.error("Please sign in to save your profile");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      localStorage.setItem("ca-active-level", activeLevel);
      // Cache the name locally so it's available even if the query hasn't refetched yet
      localStorage.setItem("ca-cached-name", name.trim());
      toast.success("Profile saved!");
    } catch (err) {
      console.error("Profile save failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Not connected")) {
        toast.error(
          "Not connected to backend. Please refresh the page and try again.",
        );
      } else if (msg.includes("Unauthorized") || msg.includes("Only users")) {
        toast.error(
          "Session expired. Please sign out and sign in again, then try saving.",
        );
      } else {
        toast.error(
          "Failed to save profile. Please try again in a few seconds.",
        );
      }
    }
  };

  const handleLevelChange = (level: CA_Level) => {
    setActiveLevel(level);
    localStorage.setItem("ca-active-level", level);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Settings
          </h2>
          <p className="text-sm text-muted-foreground font-heading mt-0.5">
            Customise your CA Study Hub experience
          </p>
        </div>

        {/* Profile Section */}
        <section
          className="rounded-2xl p-6"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(var(--primary) / 0.1)" }}
            >
              <User
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
            <h3 className="text-base font-heading font-semibold text-foreground">
              Profile
            </h3>
          </div>

          {!identity ? (
            <div
              className="rounded-xl px-5 py-6 flex flex-col items-center gap-3 text-center"
              style={{ background: "oklch(var(--muted))" }}
              data-ocid="settings.profile.signin_prompt"
            >
              <p className="text-sm font-heading text-muted-foreground">
                Sign in to save and sync your profile across sessions.
              </p>
              <Button
                onClick={() => void login()}
                className="font-heading font-semibold gap-2"
                style={{
                  background: "oklch(var(--primary))",
                  color: "oklch(var(--primary-foreground))",
                }}
                data-ocid="settings.profile.signin.button"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="name"
                  className="text-xs font-heading text-muted-foreground mb-1.5 block"
                >
                  Your Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="font-heading h-10"
                  data-ocid="settings.profile.input"
                />
              </div>

              <div>
                <Label className="text-xs font-heading text-muted-foreground mb-1.5 block">
                  Active CA Level
                </Label>
                <Select
                  value={activeLevel}
                  onValueChange={(v) => handleLevelChange(v as CA_Level)}
                >
                  <SelectTrigger className="h-10 font-heading text-sm">
                    <GraduationCap
                      className="w-4 h-4 mr-2"
                      style={{ color: "oklch(var(--primary))" }}
                    />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CA_Level).map((l) => (
                      <SelectItem
                        key={l}
                        value={l}
                        className="font-heading text-sm"
                      >
                        CA {LEVEL_LABELS[l]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground font-heading mt-1">
                  Used in dashboard and quick actions
                </p>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saveProfile.isPending}
                className="font-heading font-semibold gap-2"
                style={{
                  background: "oklch(var(--primary))",
                  color: "oklch(var(--primary-foreground))",
                }}
                data-ocid="settings.profile.save.button"
              >
                {saveProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          )}
        </section>

        {/* Theme Section */}
        <section
          className="rounded-2xl p-6"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(var(--primary) / 0.1)" }}
            >
              <Palette
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground">
                App Theme
              </h3>
              <p className="text-xs text-muted-foreground font-heading">
                Currently: <strong>{THEME_LABELS[theme]}</strong>
              </p>
            </div>
          </div>

          {/* Dark / Light Mode Toggle */}
          <div className="flex items-center gap-3 mb-5">
            <button
              type="button"
              onClick={toggleColorMode}
              className="flex items-center gap-3 rounded-xl px-4 py-3 w-full transition-all"
              style={{
                background: "oklch(var(--muted))",
                border: "1px solid oklch(var(--border))",
              }}
              data-ocid="settings.colormode.toggle"
              aria-label={
                colorMode === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "oklch(var(--primary) / 0.12)",
                  border: "1px solid oklch(var(--primary) / 0.2)",
                }}
              >
                {colorMode === "dark" ? (
                  <Moon
                    className="w-4 h-4"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                ) : (
                  <Sun
                    className="w-4 h-4"
                    style={{ color: "oklch(var(--primary))" }}
                  />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-heading font-semibold text-foreground">
                  {colorMode === "dark" ? "Dark Mode" : "Light Mode"}
                </p>
                <p className="text-xs text-muted-foreground font-heading">
                  {colorMode === "dark"
                    ? "Tap to switch to light mode"
                    : "Tap to switch to dark mode"}
                </p>
              </div>
              <div
                className="relative w-11 h-6 rounded-full flex-shrink-0 transition-all"
                style={{
                  background:
                    colorMode === "dark"
                      ? "oklch(var(--primary))"
                      : "oklch(var(--border))",
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                  style={{
                    background:
                      colorMode === "dark"
                        ? "oklch(var(--primary-foreground))"
                        : "oklch(var(--muted-foreground))",
                    left:
                      colorMode === "dark"
                        ? "calc(100% - 1.375rem)"
                        : "0.125rem",
                  }}
                />
              </div>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEMES.map((t) => {
              const isActive = theme === t;
              const colors = THEME_PREVIEW_COLORS[t];
              return (
                <motion.button
                  key={t}
                  onClick={() => setTheme(t)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative rounded-xl p-3 text-left transition-all overflow-hidden"
                  style={{
                    background: colors.bg,
                    border: isActive
                      ? `2px solid ${colors.accent}`
                      : `1px solid ${colors.accent}30`,
                    boxShadow: isActive
                      ? `0 0 16px ${colors.accent}30`
                      : "none",
                  }}
                  data-ocid={THEME_OCIDS[t]}
                >
                  {/* Color Preview Dots */}
                  <div className="flex gap-1.5 mb-2.5">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        background: colors.bg,
                        border: `2px solid ${colors.accent}60`,
                      }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ background: colors.accent }}
                    />
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ background: `${colors.text}80` }}
                    />
                  </div>

                  <p
                    className="text-xs font-heading font-bold"
                    style={{ color: colors.text }}
                  >
                    {THEME_LABELS[t]}
                  </p>
                  <p
                    className="text-[10px] font-heading mt-0.5 leading-tight line-clamp-2"
                    style={{ color: `${colors.text}80` }}
                  >
                    {THEME_DESCRIPTIONS[t]}
                  </p>

                  {isActive && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: colors.accent }}
                    >
                      <Check className="w-3 h-3" style={{ color: colors.bg }} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Quotes Section */}
        <section
          className="rounded-2xl p-6"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(var(--primary) / 0.1)" }}
            >
              <Sparkles
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
            <h3 className="text-base font-heading font-semibold text-foreground">
              Daily Quotes
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-heading text-muted-foreground mb-1.5 block">
                Auto-rotate Interval
              </Label>
              <Select
                value={autoRotate}
                onValueChange={(v) => setAutoRotate(v as AutoRotateInterval)}
              >
                <SelectTrigger
                  className="h-10 font-heading text-sm"
                  data-ocid="settings.quotes.auto_rotate.select"
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
              <Label className="text-xs font-heading text-muted-foreground mb-1.5 block">
                Default Category
              </Label>
              <Select
                value={quoteCategory}
                onValueChange={(v) =>
                  setQuoteCategory(v as QuoteCategory | "all")
                }
              >
                <SelectTrigger
                  className="h-10 font-heading text-sm"
                  data-ocid="settings.quotes.category.select"
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
        </section>

        {/* About Section */}
        <section
          className="rounded-2xl p-6"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Crown
              className="w-5 h-5"
              style={{ color: "oklch(var(--primary))" }}
            />
            <h3 className="text-base font-heading font-semibold text-foreground">
              About CA Study Hub
            </h3>
          </div>
          <div className="space-y-2 text-sm font-heading text-muted-foreground">
            <p>
              Designed exclusively for{" "}
              <strong className="text-foreground">ICAI CA Students</strong>{" "}
              across all three levels — Foundation, Intermediate, and Final.
            </p>
            <p>
              Features include Pomodoro + Stopwatch timer, weekly timetable
              planner, chapter-by-chapter progress tracking, and a PDF library
              for all 20 CA subjects.
            </p>
          </div>

          <Separator
            className="my-4"
            style={{ background: "oklch(var(--border))" }}
          />

          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "CA Levels", value: "3" },
              { label: "Subjects", value: "20" },
              { label: "Chapters", value: "240+" },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-2xl font-display font-bold"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground font-heading">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* App Activity Section */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-6"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
          data-ocid="settings.stats.section"
        >
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(var(--primary) / 0.1)" }}
            >
              <Activity
                className="w-4 h-4"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground">
                App Activity
              </h3>
              <p className="text-xs text-muted-foreground font-heading">
                Live usage across all CA students
              </p>
            </div>
          </div>

          {/* Total Registered Card */}
          <div
            className="rounded-xl p-5 mb-5 text-center"
            style={{
              background: "oklch(var(--primary) / 0.08)",
              border: "1px solid oklch(var(--primary) / 0.2)",
            }}
          >
            {statsLoading ? (
              <Skeleton className="h-12 w-24 mx-auto mb-2" />
            ) : (
              <div
                className="text-5xl font-display font-bold mb-1 tabular-nums"
                style={{ color: "oklch(var(--primary))" }}
              >
                {userStats?.totalRegistered ?? "--"}
              </div>
            )}
            <p className="text-sm font-heading text-muted-foreground">
              Total Registered Students
            </p>
          </div>

          {/* Day / Week / Month Tabs */}
          <div
            className="flex rounded-xl p-1 mb-4"
            style={{ background: "oklch(var(--muted))" }}
          >
            {(["day", "week", "month"] as const).map((tab) => {
              const labels = {
                day: "Today",
                week: "This Week",
                month: "This Month",
              };
              const ocids = {
                day: "settings.stats.day.tab",
                week: "settings.stats.week.tab",
                month: "settings.stats.month.tab",
              } as const;
              const isActive = statsTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatsTab(tab)}
                  data-ocid={ocids[tab]}
                  className="flex-1 py-2 rounded-lg text-xs font-heading font-semibold transition-all"
                  style={{
                    background: isActive ? "oklch(var(--card))" : "transparent",
                    color: isActive
                      ? "oklch(var(--primary))"
                      : "oklch(var(--muted-foreground))",
                    boxShadow: isActive
                      ? "0 1px 4px oklch(var(--border))"
                      : "none",
                  }}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* Active Users Count */}
          <div className="grid grid-cols-1 gap-3">
            <div
              className="rounded-xl p-4 flex items-center justify-between"
              style={{
                background: "oklch(var(--muted) / 0.5)",
                border: "1px solid oklch(var(--border))",
              }}
            >
              <div>
                <p className="text-xs font-heading text-muted-foreground mb-0.5">
                  {statsTab === "day"
                    ? "Active Today"
                    : statsTab === "week"
                      ? "Active This Week"
                      : "Active This Month"}
                </p>
                <p className="text-sm font-heading text-muted-foreground">
                  Students who studied recently
                </p>
              </div>
              {statsLoading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <div
                  className="text-3xl font-display font-bold tabular-nums"
                  style={{ color: "oklch(var(--primary))" }}
                >
                  {statsTab === "day"
                    ? (userStats?.activeToday ?? "--")
                    : statsTab === "week"
                      ? (userStats?.activeThisWeek ?? "--")
                      : (userStats?.activeThisMonth ?? "--")}
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
