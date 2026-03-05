import { Button } from "@/components/ui/button";
import { BookOpen, Crown, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginPage() {
  const { login, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, oklch(var(--primary)) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, oklch(var(--primary)) 0%, transparent 50%)
          `,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo & Brand */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--primary) / 0.2), oklch(var(--primary) / 0.1))",
              border: "1px solid oklch(var(--primary) / 0.3)",
              boxShadow: "0 0 40px oklch(var(--primary) / 0.2)",
            }}
          >
            <Crown
              className="w-10 h-10"
              style={{ color: "oklch(var(--primary))" }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="font-display text-4xl font-bold text-foreground mb-2"
          >
            CA Study Hub
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-muted-foreground text-sm font-heading tracking-wide uppercase"
          >
            Your ICAI Exam Companion
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-2xl p-8"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
            boxShadow: "0 4px 40px oklch(0 0 0 / 0.3)",
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <BookOpen
              className="w-5 h-5"
              style={{ color: "oklch(var(--primary))" }}
            />
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Sign in to Continue
            </h2>
          </div>

          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Access your personalised study dashboard, track progress across CA
            Foundation, Intermediate, and Final levels, and organise your study
            materials.
          </p>

          {/* Features */}
          <div className="space-y-2 mb-8">
            {[
              "Pomodoro & Stopwatch timer",
              "Weekly timetable planner",
              "Chapter progress tracker",
              "PDF library for all subjects",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "oklch(var(--primary))" }}
                />
                {feature}
              </div>
            ))}
          </div>

          {isLoginError && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{
                background: "oklch(var(--destructive) / 0.1)",
                border: "1px solid oklch(var(--destructive) / 0.3)",
                color: "oklch(var(--destructive))",
              }}
            >
              {loginError?.message || "Login failed. Please try again."}
            </div>
          )}

          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="w-full h-12 font-heading font-semibold text-base"
            style={{
              background:
                "linear-gradient(135deg, oklch(var(--primary)), oklch(var(--primary) / 0.8))",
              color: "oklch(var(--primary-foreground))",
              boxShadow: "0 4px 20px oklch(var(--primary) / 0.3)",
            }}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In with Internet Identity"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Secure, decentralized authentication via ICP
          </p>
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Designed for ICAI CA Students • Foundation • Intermediate • Final
        </p>
      </motion.div>
    </div>
  );
}
