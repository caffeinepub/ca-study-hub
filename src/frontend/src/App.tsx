import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./components/LoginPage";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useTheme } from "./hooks/useTheme";
import { DashboardPage } from "./pages/DashboardPage";
import { ICAIPapersPage } from "./pages/ICAIPapersPage";
import { ProgressPage } from "./pages/ProgressPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TimerPage } from "./pages/TimerPage";
import { TimetablePage } from "./pages/TimetablePage";

type Page =
  | "dashboard"
  | "timer"
  | "timetable"
  | "progress"
  | "pdf"
  | "settings";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 w-full max-w-sm px-6">
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse"
            style={{
              background: "oklch(var(--primary) / 0.15)",
              border: "1px solid oklch(var(--primary) / 0.3)",
            }}
          >
            <span
              className="text-2xl font-display font-bold"
              style={{ color: "oklch(var(--primary))" }}
            >
              CA
            </span>
          </div>
          <p className="text-sm font-heading text-muted-foreground">
            Loading CA Study Hub...
          </p>
        </div>
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  useTheme(); // Initialize theme

  // Set page title
  useEffect(() => {
    document.title = "CA Study Hub — ICAI Exam Companion";
  }, []);

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!identity) {
    return (
      <>
        <LoginPage />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
              color: "oklch(var(--foreground))",
            },
          }}
        />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigate={(page) => setCurrentPage(page)} />;
      case "timer":
        return <TimerPage />;
      case "timetable":
        return <TimetablePage />;
      case "progress":
        return <ProgressPage />;
      case "pdf":
        return <ICAIPapersPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={(page) => setCurrentPage(page)} />;
    }
  };

  return (
    <>
      <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </AppLayout>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
            color: "oklch(var(--foreground))",
          },
        }}
      />
    </>
  );
}
