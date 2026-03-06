import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart2,
  BookOpen,
  CalendarClock,
  Crown,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Timer,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import { useTheme } from "../hooks/useTheme";

type Page =
  | "dashboard"
  | "timer"
  | "schedule"
  | "progress"
  | "pdf"
  | "library"
  | "settings";

interface AppLayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    id: "dashboard" as Page,
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  {
    id: "timer" as Page,
    label: "Study Timer",
    icon: Timer,
    ocid: "nav.timer.link",
  },
  {
    id: "schedule" as Page,
    label: "Schedule Maker",
    icon: CalendarClock,
    ocid: "nav.schedule.link",
  },
  {
    id: "progress" as Page,
    label: "Progress",
    icon: BarChart2,
    ocid: "nav.progress.link",
  },
  {
    id: "pdf" as Page,
    label: "ICAI Papers",
    icon: GraduationCap,
    ocid: "nav.pdf.link",
  },
  {
    id: "library" as Page,
    label: "Library",
    icon: BookOpen,
    ocid: "nav.library.link",
  },
  {
    id: "settings" as Page,
    label: "Settings",
    icon: Settings,
    ocid: "nav.settings.link",
  },
];

export function AppLayout({
  currentPage,
  onNavigate,
  children,
}: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { identity, login, clear } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const { colorMode, toggleColorMode } = useTheme();

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CA";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className="hidden md:flex flex-col w-64 border-r shrink-0"
          style={{
            background: "oklch(var(--sidebar))",
            borderColor: "oklch(var(--sidebar-border))",
          }}
        >
          {/* Logo */}
          <div
            className="flex items-center gap-3 px-6 py-5 border-b"
            style={{ borderColor: "oklch(var(--sidebar-border))" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "oklch(var(--primary) / 0.15)",
                border: "1px solid oklch(var(--primary) / 0.3)",
              }}
            >
              <Crown
                className="w-5 h-5"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
            <div>
              <h1
                className="font-display text-base font-bold leading-tight"
                style={{ color: "oklch(var(--sidebar-foreground))" }}
              >
                CA Study Hub
              </h1>
              <p
                className="text-xs font-heading"
                style={{ color: "oklch(var(--sidebar-primary))" }}
              >
                ICAI Companion
              </p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-4 px-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  data-ocid={item.ocid}
                  onClick={() => onNavigate(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-heading font-medium transition-all"
                  style={{
                    background: isActive
                      ? "oklch(var(--sidebar-accent))"
                      : "transparent",
                    color: isActive
                      ? "oklch(var(--primary))"
                      : "oklch(var(--sidebar-foreground))",
                    borderLeft: isActive
                      ? "3px solid oklch(var(--primary))"
                      : "3px solid transparent",
                  }}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div
            className="p-4 border-t"
            style={{ borderColor: "oklch(var(--sidebar-border))" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: "oklch(var(--primary) / 0.2)",
                  color: "oklch(var(--primary))",
                  border: "1px solid oklch(var(--primary) / 0.3)",
                }}
              >
                {identity ? initials : "G"}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-heading font-medium truncate"
                  style={{ color: "oklch(var(--sidebar-foreground))" }}
                >
                  {identity ? profile?.name || "CA Student" : "Guest"}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  {identity ? "ICAI Student" : "Browsing as guest"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleColorMode}
                className="flex-1 h-8 text-xs font-heading justify-start gap-2"
                style={{ color: "oklch(var(--muted-foreground))" }}
                data-ocid="nav.colormode.toggle"
                aria-label={
                  colorMode === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                {colorMode === "dark" ? (
                  <>
                    <Sun className="w-3.5 h-3.5" />
                    Light
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5" />
                    Dark
                  </>
                )}
              </Button>
              {identity ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clear()}
                  className="flex-1 h-8 text-xs font-heading justify-start gap-2"
                  style={{ color: "oklch(var(--muted-foreground))" }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void login()}
                  className="flex-1 h-8 text-xs font-heading justify-start gap-2"
                  style={{ color: "oklch(var(--primary))" }}
                  data-ocid="nav.signin.button"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <header
            className="md:hidden flex items-center justify-between px-4 py-3 border-b"
            style={{
              background: "oklch(var(--sidebar))",
              borderColor: "oklch(var(--sidebar-border))",
            }}
          >
            <div className="flex items-center gap-2">
              <Crown
                className="w-5 h-5"
                style={{ color: "oklch(var(--primary))" }}
              />
              <span
                className="font-display text-base font-bold"
                style={{ color: "oklch(var(--sidebar-foreground))" }}
              >
                CA Study Hub
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleColorMode}
                className="p-2 rounded-lg"
                style={{ color: "oklch(var(--sidebar-foreground))" }}
                aria-label={
                  colorMode === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                data-ocid="nav.colormode.toggle"
              >
                {colorMode === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-lg"
                style={{ color: "oklch(var(--sidebar-foreground))" }}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Mobile Drawer */}
          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileOpen(false)}
                  className="fixed inset-0 z-40 bg-black/60 md:hidden"
                />
                <motion.aside
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col md:hidden"
                  style={{
                    background: "oklch(var(--sidebar))",
                    borderRight: "1px solid oklch(var(--sidebar-border))",
                  }}
                >
                  <div
                    className="flex items-center justify-between px-5 py-4 border-b"
                    style={{ borderColor: "oklch(var(--sidebar-border))" }}
                  >
                    <div className="flex items-center gap-3">
                      <Crown
                        className="w-6 h-6"
                        style={{ color: "oklch(var(--primary))" }}
                      />
                      <span
                        className="font-display text-lg font-bold"
                        style={{ color: "oklch(var(--sidebar-foreground))" }}
                      >
                        CA Study Hub
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileOpen(false)}
                      style={{ color: "oklch(var(--sidebar-foreground))" }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="flex-1 py-4 px-3 space-y-1">
                    {NAV_ITEMS.map((item) => {
                      const isActive = currentPage === item.id;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          data-ocid={item.ocid}
                          onClick={() => {
                            onNavigate(item.id);
                            setMobileOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-heading font-medium transition-all"
                          style={{
                            background: isActive
                              ? "oklch(var(--sidebar-accent))"
                              : "transparent",
                            color: isActive
                              ? "oklch(var(--primary))"
                              : "oklch(var(--sidebar-foreground))",
                            borderLeft: isActive
                              ? "3px solid oklch(var(--primary))"
                              : "3px solid transparent",
                          }}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>

                  <div
                    className="p-4 border-t"
                    style={{ borderColor: "oklch(var(--sidebar-border))" }}
                  >
                    {identity ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          clear();
                          setMobileOpen(false);
                        }}
                        className="w-full h-9 text-sm font-heading justify-start gap-2"
                        style={{ color: "oklch(var(--muted-foreground))" }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void login();
                          setMobileOpen(false);
                        }}
                        className="w-full h-9 text-sm font-heading justify-start gap-2"
                        style={{ color: "oklch(var(--primary))" }}
                        data-ocid="nav.signin.button"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </Button>
                    )}
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Mobile Bottom Nav */}
          <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center border-t"
            style={{
              background: "oklch(var(--sidebar))",
              borderColor: "oklch(var(--sidebar-border))",
            }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      data-ocid={item.ocid}
                      onClick={() => onNavigate(item.id)}
                      className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1"
                      style={{
                        color: isActive
                          ? "oklch(var(--primary))"
                          : "oklch(var(--muted-foreground))",
                      }}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-[9px] font-heading font-medium">
                        {item.label.split(" ")[0]}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
