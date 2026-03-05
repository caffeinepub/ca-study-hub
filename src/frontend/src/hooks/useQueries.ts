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
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

// ---- Timer Sessions ----
export function useTimerSessions() {
  const { actor, isFetching } = useActor();
  return useQuery<TimerSession[]>({
    queryKey: ["timerSessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTimerSessions();
    },
    enabled: !!actor && !isFetching,
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
      return actor.getStudySessions();
    },
    enabled: !!actor && !isFetching,
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
      return actor.getTimetable();
    },
    enabled: !!actor && !isFetching,
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
      return actor.getChapterProgress();
    },
    enabled: !!actor && !isFetching,
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
      return actor.getPDFMetadata();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddOrUpdatePDFMetadata() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (meta: any) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return actor.addOrUpdatePDFMetadata(meta);
    },
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
      return actor.removePDFMetadata(pdfId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pdfMetadata"] });
    },
  });
}
