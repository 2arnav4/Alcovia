import {
  appliedOperationIds,
  bumpServerVersion,
  notificationLogs,
  operationLog,
  persistServerData,
  rewardedSessionIds,
  serverState,
  serverVersion
} from "../data/serverState";
import { FocusSession, SyncOperation, SyncRequest, SyncResponse, TaskStatus } from "../types";
import {
  flushAutomationDeliveries,
  getAutomationDeliveries,
  queueFocusSuccessAutomation
} from "./automationService";

const TASK_STATUS_RANK: Record<TaskStatus, number> = {
  not_started: 0,
  in_progress: 1,
  done: 2
};

const FOCUS_REWARD_COINS = 50;

export function getState() {
  return {
    serverVersion,
    state: serverState,
    notifications: notificationLogs
  };
}

export async function handleSync(request: SyncRequest): Promise<SyncResponse> {
  const acceptedOperationIds = new Set<string>();

  for (const operation of request.operations) {
    acceptedOperationIds.add(operation.operationId);

    if (appliedOperationIds.has(operation.operationId)) {
      continue;
    }

    appliedOperationIds.add(operation.operationId);
    operationLog.push(operation);
    applyOperation(operation);
    bumpServerVersion();
    persistServerData();
  }

  await flushAutomationDeliveries();
  persistServerData();

  return {
    serverVersion,
    acceptedOperationIds: Array.from(acceptedOperationIds),
    state: serverState,
    notifications: notificationLogs,
    automationDeliveries: getAutomationDeliveries()
  };
}

function applyOperation(operation: SyncOperation): void {
  switch (operation.type) {
    case "task_status_changed":
      applyTaskStatusChanged(operation);
      return;
    case "task_deleted":
      applyTaskDeleted(operation);
      return;
    case "focus_session_started":
      applyFocusSessionStarted(operation);
      return;
    case "focus_session_completed":
      applyFocusSessionCompleted(operation);
      return;
    case "focus_session_failed":
      applyFocusSessionFailed(operation);
      return;
  }
}

function applyTaskStatusChanged(operation: SyncOperation): void {
  const taskId = getStringPayload(operation, "taskId");
  const incomingStatus = getTaskStatusPayload(operation, "status");
  if (!taskId || !incomingStatus) {
    return;
  }

  const task = findTask(taskId);
  if (!task || task.deleted) {
    return;
  }

  if (TASK_STATUS_RANK[incomingStatus] >= TASK_STATUS_RANK[task.status]) {
    task.status = incomingStatus;
  }
}

function applyTaskDeleted(operation: SyncOperation): void {
  const taskId = getStringPayload(operation, "taskId");
  if (!taskId) {
    return;
  }

  const task = findTask(taskId);
  if (task) {
    task.deleted = true;
  }
}

function applyFocusSessionStarted(operation: SyncOperation): void {
  const session = operation.payload.session as FocusSession | undefined;
  if (!session?.sessionId) {
    return;
  }

  const existingSession = serverState.focusSessions.find(
    (candidate) => candidate.sessionId === session.sessionId
  );
  if (existingSession?.status === "success") {
    return;
  }

  if (existingSession?.status === "failed") {
    if (
      existingSession.startedAtIso !== session.startedAtIso ||
      existingSession.targetMinutes !== session.targetMinutes ||
      existingSession.deviceId !== session.deviceId
    ) {
      return;
    }
  } else {
    upsertFocusSession({
      ...session,
      status: "running"
    });
  }

  const queuedCompletion = findLoggedFocusOperation(
    "focus_session_completed",
    session.sessionId
  );
  if (queuedCompletion) {
    applyFocusSessionCompleted(queuedCompletion);
  }
}

function applyFocusSessionCompleted(operation: SyncOperation): void {
  const sessionId = getStringPayload(operation, "sessionId");
  const targetMinutes = getNumberPayload(operation, "targetMinutes");
  const startedAtIso = getStringPayload(operation, "startedAtIso");
  const completedAtIso = getStringPayload(operation, "completedAtIso");
  if (!sessionId || !targetMinutes || !startedAtIso || !completedAtIso) {
    return;
  }

  const startedAt = Date.parse(startedAtIso);
  const completedAt = Date.parse(completedAtIso);
  const targetDurationMs = targetMinutes * 60_000;
  if (
    !Number.isFinite(startedAt) ||
    !Number.isFinite(completedAt) ||
    targetMinutes < 25 ||
    targetMinutes > 120 ||
    completedAt - startedAt < targetDurationMs
  ) {
    return;
  }

  const existingSession = serverState.focusSessions.find((session) => session.sessionId === sessionId);
  if (
    !existingSession ||
    existingSession.startedAtIso !== startedAtIso ||
    existingSession.targetMinutes !== targetMinutes ||
    existingSession.deviceId !== operation.deviceId
  ) {
    return;
  }

  const completedSession: FocusSession = {
    sessionId,
    deviceId: operation.deviceId,
    targetMinutes,
    status: "success",
    startedAtIso,
    completedAtIso
  };

  upsertFocusSession(completedSession);

  if (!rewardedSessionIds.has(sessionId)) {
    rewardedSessionIds.add(sessionId);
    serverState.student.coins += FOCUS_REWARD_COINS;
    serverState.student.todayFocusMinutes += targetMinutes;
    serverState.student.streak += 1;
  }

  queueFocusSuccessAutomation({
    sessionId,
    streak: serverState.student.streak,
    coinsAwarded: FOCUS_REWARD_COINS
  });
}

function findLoggedFocusOperation(
  type: SyncOperation["type"],
  sessionId: string
): SyncOperation | null {
  for (let index = operationLog.length - 1; index >= 0; index -= 1) {
    const operation = operationLog[index];
    if (operation.type === type && getStringPayload(operation, "sessionId") === sessionId) {
      return operation;
    }
  }

  return null;
}

function applyFocusSessionFailed(operation: SyncOperation): void {
  const sessionId = getStringPayload(operation, "sessionId");
  const reason = getStringPayload(operation, "reason");
  const targetMinutes = getNumberPayload(operation, "targetMinutes");
  const startedAtIso = getStringPayload(operation, "startedAtIso");
  const failedAtIso = getStringPayload(operation, "failedAtIso");
  if (!sessionId) {
    return;
  }

  const existingSession = serverState.focusSessions.find((session) => session.sessionId === sessionId);
  if (existingSession?.status === "success") {
    return;
  }

  upsertFocusSession({
    sessionId,
    deviceId: operation.deviceId,
    targetMinutes: existingSession?.targetMinutes ?? targetMinutes ?? 0,
    status: "failed",
    startedAtIso: existingSession?.startedAtIso ?? startedAtIso ?? new Date().toISOString(),
    failedAtIso: failedAtIso ?? new Date().toISOString(),
    failureReason: reason === "app_switch" ? "app_switch" : "give_up"
  });
}

function upsertFocusSession(nextSession: FocusSession): void {
  const index = serverState.focusSessions.findIndex(
    (session) => session.sessionId === nextSession.sessionId
  );

  if (index === -1) {
    serverState.focusSessions.unshift(nextSession);
    return;
  }

  const existingSession = serverState.focusSessions[index];
  if (existingSession.status === "success" && nextSession.status !== "success") {
    return;
  }

  serverState.focusSessions[index] = {
    ...existingSession,
    ...nextSession
  };
}

function findTask(taskId: string) {
  for (const subject of serverState.subjects) {
    for (const chapter of subject.chapters) {
      const task = chapter.tasks.find((candidate) => candidate.id === taskId);
      if (task) {
        return task;
      }
    }
  }

  return null;
}

function getStringPayload(operation: SyncOperation, key: string): string | null {
  const value = operation.payload[key];
  return typeof value === "string" ? value : null;
}

function getNumberPayload(operation: SyncOperation, key: string): number | null {
  const value = operation.payload[key];
  return typeof value === "number" ? value : null;
}

function getTaskStatusPayload(operation: SyncOperation, key: string): TaskStatus | null {
  const value = operation.payload[key];
  if (value === "not_started" || value === "in_progress" || value === "done") {
    return value;
  }

  return null;
}
