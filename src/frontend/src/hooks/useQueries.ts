import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ChapterProgress,
  PDFMetadata,
  StudySession,
  TimerSession,
  TimetableSlot,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

// ---- User Profile ----
export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCallerUserProfile();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // If user is not registered yet, return null gracefully
        if (msg.includes("not registered") || msg.includes("Unauthorized")) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!actor && !isFetching,
    // Retry to handle cases where registration is still in-flight
    retry: 3,
    retryDelay: 1500,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor)
        throw new Error("Not connected to backend. Please refresh the page.");
      try {
        return await actor.saveCallerUserProfile(profile);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("not registered") ||
          msg.includes("Unauthorized") ||
          msg.includes("Only users")
        ) {
          // User is not registered — re-initialize then retry
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            await (actor as any)._initializeAccessControlWithSecret("");
          } catch {
            // ignore re-init errors, may already be registered
          }
          await new Promise((resolve) => setTimeout(resolve, 800));
          return await actor.saveCallerUserProfile(profile);
        }
        throw err;
      }
    },
    retry: 2,
    retryDelay: (attempt: number) => attempt * 1500,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        const result = await actor.isCallerAdmin();
        // Cache the result locally so it survives page refreshes
        if (result) {
          localStorage.setItem("ca-is-admin-cached", "true");
        }
        return result;
      } catch {
        // User may not be registered yet — return false gracefully
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    // Retry a few times in case initialization is still in-flight
    retry: 5,
    retryDelay: (attempt: number) => Math.min(attempt * 1500, 5000),
    // Keep result fresh for 30 seconds so quick navigation doesn't re-fetch
    staleTime: 30_000,
  });
}

// Helper to check if an error is a "not registered" / auth error
function isAuthError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("not registered") ||
    msg.includes("Unauthorized") ||
    msg.includes("Only users")
  );
}

// ---- Timer Sessions ----
export function useTimerSessions() {
  const { actor, isFetching } = useActor();
  return useQuery<TimerSession[]>({
    queryKey: ["timerSessions"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getTimerSessions();
      } catch (err) {
        if (isAuthError(err)) return [];
        throw err;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: 1500,
  });
}

export function useAddTimerSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (session: TimerSession) => {
      if (!actor) throw new Error("Not connected");
      return actor.addTimerSession(session);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["timerSessions"] });
      void queryClient.invalidateQueries({ queryKey: ["studySessions"] });
    },
  });
}

// ---- Study Sessions ----
export function useStudySessions() {
  const { actor, isFetching } = useActor();
  return useQuery<StudySession[]>({
    queryKey: ["studySessions"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getStudySessions();
      } catch (err) {
        if (isAuthError(err)) return [];
        throw err;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: 1500,
  });
}

export function useLogStudySession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (session: StudySession) => {
      if (!actor) throw new Error("Not connected");
      return actor.logStudySession(session);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["studySessions"] });
    },
  });
}

// ---- Timetable ----
export function useTimetable() {
  const { actor, isFetching } = useActor();
  return useQuery<TimetableSlot[]>({
    queryKey: ["timetable"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getTimetable();
      } catch (err) {
        if (isAuthError(err)) return [];
        throw err;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: 1500,
  });
}

export function useAddOrUpdateTimetableSlot() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slot: TimetableSlot) => {
      if (!actor) throw new Error("Not connected");
      return actor.addOrUpdateTimetableSlot(slot);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["timetable"] });
    },
  });
}

export function useRemoveTimetableSlot() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slotId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeTimetableSlot(slotId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["timetable"] });
    },
  });
}

// ---- Chapter Progress ----
export function useChapterProgress() {
  const { actor, isFetching } = useActor();
  return useQuery<ChapterProgress[]>({
    queryKey: ["chapterProgress"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getChapterProgress();
      } catch (err) {
        if (isAuthError(err)) return [];
        throw err;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: 1500,
  });
}

export function useUpdateChapterProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chapter: ChapterProgress) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateChapterProgress(chapter);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chapterProgress"] });
    },
  });
}

// ---- PDF Metadata ----
export function usePDFMetadata() {
  const { actor, isFetching } = useActor();
  return useQuery<PDFMetadata[]>({
    queryKey: ["pdfMetadata"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getPDFMetadata();
      } catch (err) {
        if (isAuthError(err)) return [];
        throw err;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: 1500,
  });
}

export function useAddOrUpdatePDFMetadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (meta: any) => {
      if (!actor)
        throw new Error("Not connected to backend. Please refresh the page.");
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return await actor.addOrUpdatePDFMetadata(meta);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("not registered") ||
          msg.includes("Unauthorized") ||
          msg.includes("Only users")
        ) {
          // Re-register then retry
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            await (actor as any)._initializeAccessControlWithSecret("");
          } catch {
            // ignore re-init errors, may already be registered
          }
          await new Promise((resolve) => setTimeout(resolve, 800));
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          return await actor.addOrUpdatePDFMetadata(meta);
        }
        throw err;
      }
    },
    retry: 2,
    retryDelay: (attempt: number) => attempt * 1500,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pdfMetadata"] });
    },
  });
}

export function useRemovePDFMetadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pdfId: string) => {
      if (!actor) throw new Error("Not connected");
      try {
        return await actor.removePDFMetadata(pdfId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("not registered") ||
          msg.includes("Unauthorized") ||
          msg.includes("Only users")
        ) {
          // Re-register then retry
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            await (actor as any)._initializeAccessControlWithSecret("");
          } catch {
            // ignore re-init errors
          }
          await new Promise((resolve) => setTimeout(resolve, 800));
          return await actor.removePDFMetadata(pdfId);
        }
        throw err;
      }
    },
    retry: 2,
    retryDelay: (attempt: number) => attempt * 1500,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pdfMetadata"] });
    },
  });
}
