import { Clock, GraduationCap } from "lucide-react";
import { motion } from "motion/react";

export function ICAIPapersPage() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "oklch(var(--primary) / 0.1)",
                border: "1px solid oklch(var(--primary) / 0.25)",
              }}
            >
              <GraduationCap
                className="w-5 h-5"
                style={{ color: "oklch(var(--primary))" }}
              />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                ICAI Study Papers
              </h2>
              <p className="text-sm text-muted-foreground font-heading mt-0.5">
                Official ICAI study material, question papers, RTPs &amp; MTPs
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-6 min-h-[400px]"
          style={{
            background: "oklch(var(--card))",
            border: "1px dashed oklch(var(--primary) / 0.4)",
          }}
          data-ocid="icai.coming_soon.card"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: "oklch(var(--primary) / 0.1)",
              border: "1px solid oklch(var(--primary) / 0.25)",
            }}
          >
            <Clock
              className="w-10 h-10"
              style={{ color: "oklch(var(--primary))" }}
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-3xl font-bold text-foreground">
              Coming Soon
            </h3>
            <p className="text-muted-foreground font-heading text-base max-w-sm">
              ICAI Papers are being curated and will be available shortly. Stay
              tuned!
            </p>
          </div>

          <div
            className="px-4 py-2 rounded-full text-xs font-heading font-semibold"
            style={{
              background: "oklch(var(--primary) / 0.1)",
              color: "oklch(var(--primary))",
              border: "1px solid oklch(var(--primary) / 0.25)",
            }}
          >
            Under Construction
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
