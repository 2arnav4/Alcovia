import { NotificationLog, ServerStateSnapshot, SyncOperation } from "../types";
import { readJsonFile, writeJsonFile } from "./filePersistence";

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
    todayFocusMinutes: 40
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
export let serverVersion = savedServerData?.serverVersion ?? 0;
export const appliedOperationIds = new Set(savedServerData?.appliedOperationIds ?? []);
export const rewardedSessionIds = new Set(savedServerData?.rewardedSessionIds ?? []);
export const operationLog: SyncOperation[] = savedServerData?.operationLog ?? [];
export const notificationLogs: NotificationLog[] = savedServerData?.notificationLogs ?? [];

export function bumpServerVersion(): number {
  serverVersion += 1;
  return serverVersion;
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
