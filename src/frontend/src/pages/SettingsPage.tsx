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
import {
  Check,
  Crown,
  GraduationCap,
  Loader2,
  Moon,
  Palette,
  Save,
  Sun,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { CA_Level } from "../backend.d";
import { LEVEL_LABELS } from "../data/subjects";
import { useSaveUserProfile, useUserProfile } from "../hooks/useQueries";
import {
  THEME_DESCRIPTIONS,
  THEME_LABELS,
  THEME_PREVIEW_COLORS,
  type Theme,
  useTheme,
} from "../hooks/useTheme";

const THEMES: Theme[] = ["royal", "sunset", "anime", "cute", "lofi", "reality"];

const THEME_OCIDS: Record<Theme, string> = {
  royal: "settings.theme.royal.button",
  sunset: "settings.theme.sunset.button",
  anime: "settings.theme.anime.button",
  cute: "settings.theme.cute.button",
  lofi: "settings.theme.lofi.button",
  reality: "settings.theme.reality.button",
};

export function SettingsPage() {
  const { data: profile } = useUserProfile();
  const saveProfile = useSaveUserProfile();
  const { theme, setTheme, colorMode, toggleColorMode } = useTheme();

  const [name, setName] = useState(profile?.name || "");
  const [activeLevel, setActiveLevel] = useState<CA_Level>(
    (localStorage.getItem("ca-active-level") as CA_Level) ||
      CA_Level.intermediate,
  );

  // Sync name when profile loads
  useState(() => {
    if (profile?.name && !name) {
      setName(profile.name);
    }
  });

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      localStorage.setItem("ca-active-level", activeLevel);
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save profile");
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
      </motion.div>
    </div>
  );
}
