import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { CA_Level } from "../backend.d";
import { CA_SUBJECTS, LEVEL_LABELS } from "../data/subjects";
import {
  useAddOrUpdateTimetableSlot,
  useRemoveTimetableSlot,
  useTimetable,
} from "../hooks/useQueries";
import { nanoid } from "../utils/nanoid";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const TIMES = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

const LEVEL_BADGE_COLORS: Record<CA_Level, string> = {
  [CA_Level.foundation]: "var(--chart-2)",
  [CA_Level.intermediate]: "var(--primary)",
  [CA_Level.final_]: "var(--chart-3)",
};

// Pre-built ICAI Inter template
const ICAI_TEMPLATE_SLOTS = [
  {
    day: "Monday",
    time: "06:00",
    level: CA_Level.intermediate,
    subject: "Advanced Accounting",
  },
  {
    day: "Monday",
    time: "10:00",
    level: CA_Level.intermediate,
    subject: "Taxation",
  },
  {
    day: "Tuesday",
    time: "07:00",
    level: CA_Level.intermediate,
    subject: "Corporate & Other Laws",
  },
  {
    day: "Tuesday",
    time: "15:00",
    level: CA_Level.intermediate,
    subject: "Auditing and Code of Ethics",
  },
  {
    day: "Wednesday",
    time: "06:00",
    level: CA_Level.intermediate,
    subject: "Cost and Management Accounting",
  },
  {
    day: "Wednesday",
    time: "14:00",
    level: CA_Level.intermediate,
    subject: "Advanced Accounting",
  },
  {
    day: "Thursday",
    time: "07:00",
    level: CA_Level.intermediate,
    subject: "Financial Management & Strategic Management",
  },
  {
    day: "Thursday",
    time: "16:00",
    level: CA_Level.intermediate,
    subject: "Enterprise Information Systems",
  },
  {
    day: "Friday",
    time: "06:00",
    level: CA_Level.intermediate,
    subject: "Taxation",
  },
  {
    day: "Friday",
    time: "15:00",
    level: CA_Level.intermediate,
    subject: "Cost and Management Accounting",
  },
  {
    day: "Saturday",
    time: "08:00",
    level: CA_Level.intermediate,
    subject: "Corporate & Other Laws",
  },
  {
    day: "Saturday",
    time: "14:00",
    level: CA_Level.intermediate,
    subject: "Auditing and Code of Ethics",
  },
  {
    day: "Sunday",
    time: "09:00",
    level: CA_Level.intermediate,
    subject: "Revision & Practice",
  },
];

export function TimetablePage() {
  const { data: slots = [], isLoading } = useTimetable();
  const addSlot = useAddOrUpdateTimetableSlot();
  const removeSlot = useRemoveTimetableSlot();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formDay, setFormDay] = useState(DAYS[0]);
  const [formTime, setFormTime] = useState("09:00");
  const [formLevel, setFormLevel] = useState<CA_Level>(CA_Level.intermediate);
  const [formSubject, setFormSubject] = useState("");
  const [saving, setSaving] = useState(false);

  const subjects = CA_SUBJECTS.filter((s) => s.level === formLevel);

  const handleAdd = async () => {
    if (!formSubject) {
      toast.error("Please select a subject");
      return;
    }
    setSaving(true);
    try {
      await addSlot.mutateAsync({
        slotId: nanoid(),
        dayOfWeek: formDay,
        time: formTime,
        caLevel: formLevel,
        subject: formSubject,
      });
      toast.success("Slot added to timetable");
      setDialogOpen(false);
      setFormSubject("");
    } catch {
      toast.error("Failed to add slot");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    try {
      await removeSlot.mutateAsync(slotId);
      toast.success("Slot removed");
    } catch {
      toast.error("Failed to remove slot");
    }
  };

  const handleApplyTemplate = async () => {
    setSaving(true);
    try {
      await Promise.all(
        ICAI_TEMPLATE_SLOTS.map((t) =>
          addSlot.mutateAsync({
            slotId: nanoid(),
            dayOfWeek: t.day,
            time: t.time,
            caLevel: t.level,
            subject: t.subject,
          }),
        ),
      );
      toast.success("ICAI Inter template applied!");
    } catch {
      toast.error("Failed to apply template");
    } finally {
      setSaving(false);
    }
  };

  // Group slots by day
  const slotsByDay = DAYS.reduce<Record<string, typeof slots>>((acc, day) => {
    acc[day] = slots
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.time.localeCompare(b.time));
    return acc;
  }, {});

  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Weekly Timetable
            </h2>
            <p className="text-sm text-muted-foreground font-heading mt-0.5">
              Plan your study week across all CA levels
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyTemplate}
              disabled={saving}
              className="font-heading text-sm gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              ICAI Template
            </Button>
            <Button
              onClick={() => setDialogOpen(true)}
              size="sm"
              className="font-heading text-sm gap-2"
              style={{
                background: "oklch(var(--primary))",
                color: "oklch(var(--primary-foreground))",
              }}
              data-ocid="timetable.add.open_modal_button"
            >
              <Plus className="w-4 h-4" />
              Add Slot
            </Button>
          </div>
        </div>

        {/* Timetable Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {DAYS.map((d) => (
              <Skeleton key={d} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {DAYS.map((day, dayIdx) => {
              const daySlots = slotsByDay[day] || [];
              const isToday = day === today;
              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dayIdx * 0.05 }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "oklch(var(--card))",
                    border: isToday
                      ? "2px solid oklch(var(--primary) / 0.5)"
                      : "1px solid oklch(var(--border))",
                    boxShadow: isToday
                      ? "0 0 16px oklch(var(--primary) / 0.15)"
                      : "none",
                  }}
                >
                  {/* Day Header */}
                  <div
                    className="px-3 py-2 flex items-center justify-between"
                    style={{
                      background: isToday
                        ? "oklch(var(--primary) / 0.1)"
                        : "oklch(var(--muted) / 0.4)",
                      borderBottom: "1px solid oklch(var(--border))",
                    }}
                  >
                    <span
                      className="text-xs font-heading font-bold uppercase tracking-wider"
                      style={{
                        color: isToday
                          ? "oklch(var(--primary))"
                          : "oklch(var(--foreground))",
                      }}
                    >
                      {day.slice(0, 3)}
                    </span>
                    {isToday && (
                      <Badge
                        className="text-[10px] font-heading px-1.5 py-0"
                        style={{
                          background: "oklch(var(--primary) / 0.2)",
                          color: "oklch(var(--primary))",
                          border: "none",
                        }}
                      >
                        Today
                      </Badge>
                    )}
                  </div>

                  {/* Slots */}
                  <div className="p-2 space-y-1.5 min-h-[80px]">
                    {daySlots.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFormDay(day);
                          setDialogOpen(true);
                        }}
                        className="w-full py-4 text-xs text-muted-foreground font-heading text-center rounded-lg border border-dashed transition-colors hover:border-primary/50"
                        style={{ borderColor: "oklch(var(--border))" }}
                      >
                        + Add
                      </button>
                    ) : (
                      daySlots.map((slot, i) => (
                        <div
                          key={slot.slotId}
                          className="group relative p-2 rounded-lg text-xs"
                          style={{
                            background: `oklch(${LEVEL_BADGE_COLORS[slot.caLevel]} / 0.1)`,
                            border: `1px solid oklch(${LEVEL_BADGE_COLORS[slot.caLevel]} / 0.25)`,
                          }}
                          data-ocid={`timetable.slot.item.${i + 1}`}
                        >
                          <div
                            className="flex items-center gap-1 mb-0.5"
                            style={{
                              color: `oklch(${LEVEL_BADGE_COLORS[slot.caLevel]})`,
                            }}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span className="font-bold font-heading">
                              {slot.time}
                            </span>
                          </div>
                          <p className="text-foreground font-heading font-medium leading-tight line-clamp-2">
                            {slot.subject}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleDelete(slot.slotId)}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                            style={{ color: "oklch(var(--destructive))" }}
                            data-ocid={`timetable.slot.delete_button.${i + 1}`}
                            aria-label="Delete slot"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <div
          className="flex flex-wrap gap-3 p-4 rounded-xl"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <div className="text-sm font-heading text-muted-foreground">
            Total slots:{" "}
            <strong className="text-foreground">{slots.length}</strong>
          </div>
          {Object.values(CA_Level).map((level) => {
            const count = slots.filter((s) => s.caLevel === level).length;
            if (count === 0) return null;
            return (
              <Badge
                key={level}
                className="font-heading text-xs"
                style={{
                  background: `oklch(${LEVEL_BADGE_COLORS[level]} / 0.15)`,
                  color: `oklch(${LEVEL_BADGE_COLORS[level]})`,
                  border: `1px solid oklch(${LEVEL_BADGE_COLORS[level]} / 0.3)`,
                }}
              >
                {LEVEL_LABELS[level]}: {count}
              </Badge>
            );
          })}
        </div>
      </motion.div>

      {/* Add Slot Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-md"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
          data-ocid="timetable.slot.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Calendar
                className="w-5 h-5"
                style={{ color: "oklch(var(--primary))" }}
              />
              Add Timetable Slot
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-heading text-muted-foreground mb-1.5">
                  Day
                </p>
                <Select value={formDay} onValueChange={setFormDay}>
                  <SelectTrigger className="h-9 text-sm font-heading">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem
                        key={d}
                        value={d}
                        className="font-heading text-sm"
                      >
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-heading text-muted-foreground mb-1.5">
                  Time
                </p>
                <Select value={formTime} onValueChange={setFormTime}>
                  <SelectTrigger className="h-9 text-sm font-heading">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMES.map((t) => (
                      <SelectItem
                        key={t}
                        value={t}
                        className="font-heading text-sm"
                      >
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <p className="text-xs font-heading text-muted-foreground mb-1.5">
                CA Level
              </p>
              <Select
                value={formLevel}
                onValueChange={(v) => {
                  setFormLevel(v as CA_Level);
                  setFormSubject("");
                }}
              >
                <SelectTrigger className="h-9 text-sm font-heading">
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
              <Select value={formSubject} onValueChange={setFormSubject}>
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
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="font-heading"
              data-ocid="timetable.slot.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={saving || !formSubject}
              className="font-heading"
              style={{
                background: "oklch(var(--primary))",
                color: "oklch(var(--primary-foreground))",
              }}
              data-ocid="timetable.slot.confirm_button"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 w-4 h-4" />
                  Add Slot
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
