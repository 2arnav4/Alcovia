export type StudentId = "student_1";
export type DeviceId = "phone" | "laptop";
export type TaskStatus = "not_started" | "in_progress" | "done";
export type FocusSessionStatus = "running" | "success" | "failed";
export type SyncOperationType =
  | "focus_session_started"
  | "focus_session_completed"
  | "focus_session_failed"
  | "task_status_changed"
  | "task_deleted";

export interface StudentState {
  studentId: StudentId;
  coins: number;
  streak: number;
  todayFocusMinutes: number;
}

export interface StudyTask {
  id: string;
  title: string;
  status: TaskStatus;
  deleted?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  tasks: StudyTask[];
}

export interface Subject {
  id: string;
  title: string;
  chapters: Chapter[];
}

export interface FocusSession {
  sessionId: string;
  deviceId: DeviceId;
  targetMinutes: number;
  status: FocusSessionStatus;
  startedAtIso: string;
  completedAtIso?: string;
  failedAtIso?: string;
  failureReason?: "give_up" | "app_switch";
}

export interface SyncOperation {
  operationId: string;
  deviceId: DeviceId;
  studentId: StudentId;
  type: SyncOperationType;
  payload: Record<string, unknown>;
  localSequence: number;
}

export interface SyncRequest {
  studentId: StudentId;
  deviceId: DeviceId;
  operations: SyncOperation[];
  lastKnownServerVersion: number;
}

export interface SyncResponse {
  serverVersion: number;
  acceptedOperationIds: string[];
  state: ServerStateSnapshot;
  notifications: NotificationLog[];
}

export interface NotificationLog {
  id: string;
  sessionId?: string;
  message: string;
  createdAtIso: string;
}

export interface ServerStateSnapshot {
  student: StudentState;
  subjects: Subject[];
  focusSessions: FocusSession[];
}
