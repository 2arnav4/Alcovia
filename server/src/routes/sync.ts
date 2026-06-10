import { Router } from "express";
import { DeviceId, SyncOperationType, SyncRequest } from "../types";
import { handleSync } from "../services/syncService";

export const syncRouter = Router();

syncRouter.post("/", async (request, response) => {
  const syncRequest = request.body as Partial<SyncRequest>;
  const validationError = validateSyncRequest(syncRequest);
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }

  response.json(await handleSync(syncRequest as SyncRequest));
});

const DEVICE_IDS: DeviceId[] = ["phone", "laptop"];
const OPERATION_TYPES: SyncOperationType[] = [
  "focus_session_started",
  "focus_session_completed",
  "focus_session_failed",
  "task_status_changed",
  "task_deleted"
];

function validateSyncRequest(request: Partial<SyncRequest>): string | null {
  if (request.studentId !== "student_1") {
    return "studentId must be student_1";
  }

  if (!request.deviceId || !DEVICE_IDS.includes(request.deviceId)) {
    return "deviceId must be phone or laptop";
  }

  if (!Array.isArray(request.operations)) {
    return "operations must be an array";
  }

  if (typeof request.lastKnownServerVersion !== "number") {
    return "lastKnownServerVersion must be a number";
  }

  for (const operation of request.operations) {
    if (!operation.operationId || typeof operation.operationId !== "string") {
      return "each operation requires operationId";
    }

    if (!operation.deviceId || !DEVICE_IDS.includes(operation.deviceId)) {
      return "each operation requires a valid deviceId";
    }

    if (operation.deviceId !== request.deviceId) {
      return "operation deviceId must match request deviceId";
    }

    if (operation.studentId !== "student_1") {
      return "each operation requires studentId student_1";
    }

    if (!OPERATION_TYPES.includes(operation.type)) {
      return "each operation requires a valid type";
    }

    if (typeof operation.localSequence !== "number") {
      return "each operation requires localSequence";
    }

    if (!operation.payload || typeof operation.payload !== "object") {
      return "each operation requires payload";
    }

    const payloadError = validateOperationPayload(
      operation.type,
      operation.payload,
      operation.deviceId
    );
    if (payloadError) {
      return payloadError;
    }
  }

  return null;
}

function validateOperationPayload(
  type: SyncOperationType,
  payload: Record<string, unknown>,
  operationDeviceId: DeviceId
): string | null {
  switch (type) {
    case "task_status_changed":
      if (!isText(payload.taskId)) {
        return "task status operation requires taskId";
      }
      if (
        payload.status !== "not_started" &&
        payload.status !== "in_progress" &&
        payload.status !== "done"
      ) {
        return "task status operation requires a valid status";
      }
      return null;
    case "task_deleted":
      return isText(payload.taskId) ? null : "task delete operation requires taskId";
    case "focus_session_started": {
      if (!payload.session || typeof payload.session !== "object") {
        return "focus start operation requires session";
      }
      const session = payload.session as Record<string, unknown>;
      if (!isText(session.sessionId) || !isIsoDate(session.startedAtIso)) {
        return "focus start operation requires sessionId and startedAtIso";
      }
      if (!isTargetMinutes(session.targetMinutes)) {
        return "focus start operation requires targetMinutes between 25 and 120";
      }
      if (session.deviceId !== operationDeviceId || session.status !== "running") {
        return "focus start session must match its operation device and be running";
      }
      return null;
    }
    case "focus_session_completed":
      if (
        !isText(payload.sessionId) ||
        !isIsoDate(payload.startedAtIso) ||
        !isIsoDate(payload.completedAtIso)
      ) {
        return "focus completion requires sessionId, startedAtIso and completedAtIso";
      }
      return isTargetMinutes(payload.targetMinutes)
        ? null
        : "focus completion requires targetMinutes between 25 and 120";
    case "focus_session_failed":
      if (
        !isText(payload.sessionId) ||
        !isIsoDate(payload.startedAtIso) ||
        !isIsoDate(payload.failedAtIso)
      ) {
        return "focus failure requires sessionId, startedAtIso and failedAtIso";
      }
      if (payload.reason !== "give_up" && payload.reason !== "app_switch") {
        return "focus failure requires a valid reason";
      }
      return isTargetMinutes(payload.targetMinutes)
        ? null
        : "focus failure requires targetMinutes between 25 and 120";
  }
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isTargetMinutes(value: unknown): value is number {
  const numericValue = Number(value);
  const testDurationAllowed = process.env.FOCUS_TEST_MODE === "true" && numericValue === 1;
  return (
    Number.isInteger(value) &&
    (testDurationAllowed || (numericValue >= 25 && numericValue <= 120))
  );
}
