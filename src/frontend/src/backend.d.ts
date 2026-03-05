import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TimetableSlot {
    subject: string;
    dayOfWeek: string;
    time: string;
    slotId: string;
    caLevel: CA_Level;
}
export interface PDFMetadata {
    subject: string;
    blobKey: ExternalBlob;
    name: string;
    pdfId: string;
    caLevel: CA_Level;
}
export type Time = bigint;
export interface TimerSession {
    durationMins: bigint;
    subject: string;
    timerId: string;
    caLevel: CA_Level;
    timerType: Variant_stopwatch_pomodoro;
}
export interface StudySession {
    durationMins: bigint;
    subject: string;
    timestamp: Time;
    sessionId: string;
    caLevel: CA_Level;
}
export interface ChapterProgress {
    subject: string;
    completed: boolean;
    chapterId: string;
    caLevel: CA_Level;
}
export interface UserProfile {
    name: string;
}
export enum CA_Level {
    final_ = "final",
    intermediate = "intermediate",
    foundation = "foundation"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_stopwatch_pomodoro {
    stopwatch = "stopwatch",
    pomodoro = "pomodoro"
}
export interface backendInterface {
    addOrUpdatePDFMetadata(meta: PDFMetadata): Promise<void>;
    addOrUpdateTimetableSlot(slot: TimetableSlot): Promise<void>;
    addTimerSession(session: TimerSession): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChapterProgress(): Promise<Array<ChapterProgress>>;
    getPDFMetadata(): Promise<Array<PDFMetadata>>;
    getStudySessions(): Promise<Array<StudySession>>;
    getTimerSessions(): Promise<Array<TimerSession>>;
    getTimetable(): Promise<Array<TimetableSlot>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    logStudySession(session: StudySession): Promise<void>;
    removePDFMetadata(pdfId: string): Promise<void>;
    removeTimetableSlot(slotId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateChapterProgress(chapter: ChapterProgress): Promise<void>;
}
