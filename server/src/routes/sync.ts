import { Router } from "express";
import { DeviceId, SyncOperationType, SyncRequest } from "../types";
import { handleSync } from "../services/syncService";

export const syncRouter = Router();

syncRouter.post("/", (request, response) => {
  const syncRequest = request.body as Partial<SyncRequest>;
  const validationError = validateSyncRequest(syncRequest);
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }

  response.json(handleSync(syncRequest as SyncRequest));
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
  }

  return null;
}
