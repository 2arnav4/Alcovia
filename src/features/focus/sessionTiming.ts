import { FocusSession } from "@/types";

export const FOCUS_AWAY_GRACE_MS = 5_000;

export function getSessionEndTime(session: FocusSession): number {
  return new Date(session.startedAtIso).getTime() + session.targetMinutes * 60_000;
}

export function getRemainingSeconds(session: FocusSession, now: number): number {
  return Math.max(0, Math.ceil((getSessionEndTime(session) - now) / 1_000));
}

export function getSessionProgress(session: FocusSession, now: number): number {
  const startedAt = new Date(session.startedAtIso).getTime();
  const durationMs = session.targetMinutes * 60_000;
  return Math.min(1, Math.max(0, (now - startedAt) / durationMs));
}

export function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
