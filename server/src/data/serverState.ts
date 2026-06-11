import { NotificationLog, ServerStateSnapshot, SyncOperation } from "../types";
import { readJsonFile, writeJsonFile } from "./filePersistence";

function getFocusDate(isoDate = new Date().toISOString()): string {
  return isoDate.slice(0, 10);
}

interface PersistedServerData {
  appliedOperationIds: string[];
  notificationLogs: NotificationLog[];
  operationLog: SyncOperation[];
  rewardedSessionIds: string[];
  serverState: ServerStateSnapshot;
  serverVersion: number;
}

const initialServerState: ServerStateSnapshot = {
  student: {
    studentId: "student_1",
    coins: 120,
    streak: 3,
    lastStreakDate: null,
    todayFocusMinutes: 40,
    todayFocusDate: getFocusDate()
  },
  focusSessions: [],
  subjects: [
    {
      id: "math",
      title: "Mathematics",
      chapters: [
        {
          id: "math-algebra",
          title: "Algebra",
          tasks: [
            { id: "math-algebra-linear", title: "Linear equations", status: "done" },
            { id: "math-algebra-quadratic", title: "Quadratic basics", status: "in_progress" },
            { id: "math-algebra-word", title: "Word problems", status: "not_started" }
          ]
        },
        {
          id: "math-geometry",
          title: "Geometry",
          tasks: [
            { id: "math-geometry-triangles", title: "Triangle properties", status: "done" },
            { id: "math-geometry-circles", title: "Circles", status: "not_started" }
          ]
        }
      ]
    },
    {
      id: "science",
      title: "Science",
      chapters: [
        {
          id: "science-physics",
          title: "Physics",
          tasks: [
            { id: "science-physics-motion", title: "Motion graphs", status: "in_progress" },
            { id: "science-physics-force", title: "Force and laws", status: "not_started" }
          ]
        },
        {
          id: "science-chemistry",
          title: "Chemistry",
          tasks: [
            { id: "science-chemistry-atoms", title: "Atoms and molecules", status: "done" },
            { id: "science-chemistry-reactions", title: "Chemical reactions", status: "not_started" }
          ]
        }
      ]
    },
    {
      id: "english",
      title: "English",
      chapters: [
        {
          id: "english-writing",
          title: "Writing",
          tasks: [
            { id: "english-writing-essay", title: "Essay outline", status: "done" },
            { id: "english-writing-edit", title: "Revise draft", status: "in_progress" }
          ]
        }
      ]
    }
  ]
};

const savedServerData = readJsonFile<PersistedServerData>("server-state.json");

export const serverState: ServerStateSnapshot =
  savedServerData?.serverState ?? initialServerState;
serverState.student.todayFocusDate ??= getFocusDate();
if (serverState.student.lastStreakDate === undefined) {
  const successfulDates = Array.from(
    new Set(
      serverState.focusSessions
        .filter((session) => session.status === "success" && session.completedAtIso)
        .map((session) => getFocusDate(session.completedAtIso!))
    )
  ).sort();

  serverState.student.lastStreakDate = successfulDates.at(-1) ?? null;
  if (successfulDates.length > 0) {
    serverState.student.streak = initialServerState.student.streak + successfulDates.length;
  }
}
resetTodayFocusIfNeeded();
export let serverVersion = savedServerData?.serverVersion ?? 0;
export const appliedOperationIds = new Set(savedServerData?.appliedOperationIds ?? []);
export const rewardedSessionIds = new Set(savedServerData?.rewardedSessionIds ?? []);
export const operationLog: SyncOperation[] = savedServerData?.operationLog ?? [];
export const notificationLogs: NotificationLog[] = savedServerData?.notificationLogs ?? [];

export function bumpServerVersion(): number {
  serverVersion += 1;
  return serverVersion;
}

export function resetTodayFocusIfNeeded(): void {
  const currentDate = getFocusDate();
  if (serverState.student.todayFocusDate !== currentDate) {
    serverState.student.todayFocusDate = currentDate;
    serverState.student.todayFocusMinutes = 0;
  }
}

export function persistServerData(): void {
  writeJsonFile("server-state.json", {
    appliedOperationIds: Array.from(appliedOperationIds),
    notificationLogs,
    operationLog,
    rewardedSessionIds: Array.from(rewardedSessionIds),
    serverState,
    serverVersion
  } satisfies PersistedServerData);
}

export function resetServerData(): void {
  const freshState = structuredClone(initialServerState);
  freshState.student.todayFocusDate = getFocusDate();

  serverState.student = freshState.student;
  serverState.focusSessions = freshState.focusSessions;
  serverState.subjects = freshState.subjects;
  serverVersion = 0;
  appliedOperationIds.clear();
  rewardedSessionIds.clear();
  operationLog.length = 0;
  notificationLogs.length = 0;
  persistServerData();
}
