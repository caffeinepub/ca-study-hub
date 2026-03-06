import { CA_Level } from "../backend.d";
import { CA_SUBJECTS } from "../data/subjects";

export interface ScheduleBlock {
  day: string;
  week: number;
  time: string;
  endTime: string;
  subject: string;
  isRevision: boolean;
  isWeak: boolean;
  durationHrs: number;
}

export interface ScheduleInput {
  level: CA_Level;
  examDate: Date;
  dailyHours: number;
  weakSubjects: string[];
  preferredTime: "morning" | "afternoon" | "evening" | "night";
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

function addHoursToTime(timeStr: string, hours: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMins = h * 60 + m + Math.round(hours * 60);
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function getStartTime(
  preferredTime: ScheduleInput["preferredTime"],
  session: "first" | "second",
): string {
  const timeMap: Record<
    ScheduleInput["preferredTime"],
    { first: string; second: string }
  > = {
    morning: { first: "06:00", second: "09:30" },
    afternoon: { first: "12:00", second: "15:00" },
    evening: { first: "18:00", second: "20:00" },
    night: { first: "22:00", second: "00:00" },
  };
  return timeMap[preferredTime][session];
}

export function generateSchedule(input: ScheduleInput): ScheduleBlock[] {
  const { level, examDate, dailyHours, weakSubjects, preferredTime } = input;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);

  const daysRemaining = Math.max(
    1,
    Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const weeksToGenerate = Math.min(4, Math.ceil(daysRemaining / 7));
  const subjects = CA_SUBJECTS.filter((s) => s.level === level);

  if (subjects.length === 0) return [];

  // Assign weights: weak subjects get 1.5x
  const weights = subjects.map((s) =>
    weakSubjects.includes(s.name) ? 1.5 : 1.0,
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // Create a weighted rotation array
  const rotation: { name: string; isWeak: boolean }[] = [];
  subjects.forEach((s, i) => {
    const slots = Math.round((weights[i] / totalWeight) * 14); // 14 = 2 slots per day * 7 days
    for (let j = 0; j < Math.max(1, slots); j++) {
      rotation.push({ name: s.name, isWeak: weakSubjects.includes(s.name) });
    }
  });

  // Shuffle rotation deterministically
  for (let i = rotation.length - 1; i > 0; i--) {
    const j = (i * 1103515245 + 12345) % (i + 1);
    [rotation[i], rotation[j]] = [rotation[j], rotation[i]];
  }

  const blocks: ScheduleBlock[] = [];
  let rotIdx = 0;

  for (let week = 1; week <= weeksToGenerate; week++) {
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const day = DAYS[dayIdx];
      const isSunday = dayIdx === 6;

      if (isSunday) {
        // Sunday = Revision
        const startTime = getStartTime(preferredTime, "first");
        blocks.push({
          day,
          week,
          time: startTime,
          endTime: addHoursToTime(startTime, Math.min(dailyHours, 4)),
          subject: "Full Revision & Practice Tests",
          isRevision: true,
          isWeak: false,
          durationHrs: Math.min(dailyHours, 4),
        });
        continue;
      }

      // Split daily hours into 2 sessions
      const session1Hours = Math.max(1, Math.floor(dailyHours * 0.6));
      const session2Hours = Math.max(
        0.5,
        Number.parseFloat((dailyHours - session1Hours).toFixed(1)),
      );

      if (dailyHours >= 2) {
        // Session 1
        const s1 = rotation[rotIdx % rotation.length];
        rotIdx++;
        const start1 = getStartTime(preferredTime, "first");
        blocks.push({
          day,
          week,
          time: start1,
          endTime: addHoursToTime(start1, session1Hours),
          subject: s1.name,
          isRevision: false,
          isWeak: s1.isWeak,
          durationHrs: session1Hours,
        });

        // Session 2
        const s2 = rotation[rotIdx % rotation.length];
        rotIdx++;
        const start2 = getStartTime(preferredTime, "second");
        blocks.push({
          day,
          week,
          time: start2,
          endTime: addHoursToTime(start2, session2Hours),
          subject: s2.name,
          isRevision: false,
          isWeak: s2.isWeak,
          durationHrs: session2Hours,
        });
      } else {
        // Single session
        const s = rotation[rotIdx % rotation.length];
        rotIdx++;
        const start = getStartTime(preferredTime, "first");
        blocks.push({
          day,
          week,
          time: start,
          endTime: addHoursToTime(start, dailyHours),
          subject: s.name,
          isRevision: false,
          isWeak: s.isWeak,
          durationHrs: dailyHours,
        });
      }
    }
  }

  return blocks;
}

export function scheduleToText(
  blocks: ScheduleBlock[],
  level: CA_Level,
): string {
  const levelLabels: Record<CA_Level, string> = {
    [CA_Level.foundation]: "CA Foundation",
    [CA_Level.intermediate]: "CA Intermediate",
    [CA_Level.final_]: "CA Final",
  };

  const lines: string[] = [
    `===== CA Study Schedule (${levelLabels[level]}) =====`,
    "",
  ];

  const weeks = [...new Set(blocks.map((b) => b.week))].sort();

  for (const week of weeks) {
    lines.push(`WEEK ${week}`);
    lines.push("-".repeat(40));
    const weekBlocks = blocks.filter((b) => b.week === week);
    for (const day of DAYS) {
      const dayBlocks = weekBlocks.filter((b) => b.day === day);
      if (dayBlocks.length === 0) continue;
      lines.push(`${day}:`);
      for (const block of dayBlocks) {
        const tag = block.isRevision
          ? "[REVISION]"
          : block.isWeak
            ? "[WEAK]"
            : "";
        lines.push(
          `  ${block.time} – ${block.endTime}  ${block.subject} ${tag}`.trim(),
        );
      }
    }
    lines.push("");
  }

  lines.push("Generated by CA Study Hub | caffeine.ai");
  return lines.join("\n");
}
