/**
 * useUserStats — tracks app usage statistics locally via localStorage.
 * Since the backend does not expose getUserStats / recordActivity endpoints,
 * we maintain a client-side registry keyed by principal (or "guest" fingerprint).
 *
 * Data shape stored in localStorage under "ca_user_stats":
 * {
 *   totalRegistered: number;
 *   sessions: { key: string; timestamps: number[] }[]  // per-user session timestamps
 * }
 */

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ca_user_stats";
const SESSION_KEY = "ca_session_recorded";

export interface UserStats {
  totalRegistered: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
}

interface StatsData {
  // Map from user key to array of activity timestamps (ms)
  users: Record<string, number[]>;
}

function loadData(): StatsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { users: {} };
    return JSON.parse(raw) as StatsData;
  } catch {
    return { users: {} };
  }
}

function saveData(data: StatsData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function computeStats(data: StatsData): UserStats {
  const now = Date.now();
  const DAY = 86_400_000;
  const WEEK = 7 * DAY;
  const MONTH = 30 * DAY;

  const totalRegistered = Object.keys(data.users).length;
  let activeToday = 0;
  let activeThisWeek = 0;
  let activeThisMonth = 0;

  for (const timestamps of Object.values(data.users)) {
    const recent = Math.max(...timestamps);
    if (now - recent <= DAY) activeToday++;
    if (now - recent <= WEEK) activeThisWeek++;
    if (now - recent <= MONTH) activeThisMonth++;
  }

  return { totalRegistered, activeToday, activeThisWeek, activeThisMonth };
}

/**
 * Call this when a user signs in or opens the app.
 * @param userKey — principal string, or a stable guest fingerprint
 */
export function recordActivity(userKey: string): void {
  const data = loadData();
  const now = Date.now();
  if (!data.users[userKey]) {
    data.users[userKey] = [];
  }
  // Keep only last 90 days of timestamps to prevent unbounded growth
  const cutoff = now - 90 * 86_400_000;
  data.users[userKey] = data.users[userKey]
    .filter((t) => t > cutoff)
    .concat(now);
  saveData(data);
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    const data = loadData();
    setStats(computeStats(data));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // Refresh every 60 seconds
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { stats, isLoading };
}

/**
 * Hook to record activity for the current session.
 * Call in AppLayout after identity is resolved.
 */
export function useRecordActivity(userKey: string | null) {
  useEffect(() => {
    if (!userKey) return;
    // Only record once per browser session per user
    const sessionFlag = `${SESSION_KEY}_${userKey}`;
    if (sessionStorage.getItem(sessionFlag)) return;
    sessionStorage.setItem(sessionFlag, "1");
    recordActivity(userKey);
  }, [userKey]);
}
