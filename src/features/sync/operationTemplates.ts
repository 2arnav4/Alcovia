import {
  DeviceId,
  FocusFailureReason,
  FocusSession,
  StudentId,
  SyncOperation,
  TaskStatus
} from "@/types";
import { createLocalId } from "@/utils/ids";

interface OperationBaseInput {
  deviceId: DeviceId;
  localSequence: number;
  studentId: StudentId;
}

export function createTaskStatusChangedOperation(
  input: OperationBaseInput & { taskId: string; status: TaskStatus }
): SyncOperation {
  validateBaseInput(input);
  requireText(input.taskId, "taskId");
  return {
    operationId: createLocalId("op_task_status", input.deviceId),
    deviceId: input.deviceId,
    studentId: input.studentId,
    type: "task_status_changed",
    localSequence: input.localSequence,
    payload: {
      taskId: input.taskId,
      status: input.status
    }
  };
}

export function createTaskDeletedOperation(
  input: OperationBaseInput & { taskId: string }
): SyncOperation {
  validateBaseInput(input);
  requireText(input.taskId, "taskId");
  return {
    operationId: createLocalId("op_task_delete", input.deviceId),
    deviceId: input.deviceId,
    studentId: input.studentId,
    type: "task_deleted",
    localSequence: input.localSequence,
    payload: {
      taskId: input.taskId
    }
  };
}

export function createFocusSessionStartedOperation(
  input: OperationBaseInput & { session: FocusSession }
): SyncOperation {
  validateBaseInput(input);
  requireText(input.session.sessionId, "sessionId");
  requireIsoDate(input.session.startedAtIso, "startedAtIso");
  requireTargetMinutes(input.session.targetMinutes);
  if (input.session.deviceId !== input.deviceId) {
    throw new Error("session deviceId must match operation deviceId");
  }
  return {
    operationId: createLocalId("op_focus_start", input.deviceId),
    deviceId: input.deviceId,
    studentId: input.studentId,
    type: "focus_session_started",
    localSequence: input.localSequence,
    payload: {
      session: input.session
    }
  };
}

export function createFocusSessionCompletedOperation(
  input: OperationBaseInput & {
    completedAtIso: string;
    sessionId: string;
    startedAtIso: string;
    targetMinutes: number;
  }
): SyncOperation {
  validateBaseInput(input);
  requireText(input.sessionId, "sessionId");
  requireIsoDate(input.startedAtIso, "startedAtIso");
  requireIsoDate(input.completedAtIso, "completedAtIso");
  requireTargetMinutes(input.targetMinutes);
  return {
    operationId: createLocalId("op_focus_complete", input.deviceId),
    deviceId: input.deviceId,
    studentId: input.studentId,
    type: "focus_session_completed",
    localSequence: input.localSequence,
    payload: {
      completedAtIso: input.completedAtIso,
      sessionId: input.sessionId,
      startedAtIso: input.startedAtIso,
      targetMinutes: input.targetMinutes
    }
  };
}

export function createFocusSessionFailedOperation(
  input: OperationBaseInput & {
    failedAtIso: string;
    reason: FocusFailureReason;
    sessionId: string;
    startedAtIso: string;
    targetMinutes: number;
  }
): SyncOperation {
  validateBaseInput(input);
  requireText(input.sessionId, "sessionId");
  requireIsoDate(input.startedAtIso, "startedAtIso");
  requireIsoDate(input.failedAtIso, "failedAtIso");
  requireTargetMinutes(input.targetMinutes);
  return {
    operationId: createLocalId("op_focus_fail", input.deviceId),
    deviceId: input.deviceId,
    studentId: input.studentId,
    type: "focus_session_failed",
    localSequence: input.localSequence,
    payload: {
      failedAtIso: input.failedAtIso,
      sessionId: input.sessionId,
      reason: input.reason,
      startedAtIso: input.startedAtIso,
      targetMinutes: input.targetMinutes
    }
  };
}

function validateBaseInput(input: OperationBaseInput): void {
  if (!Number.isInteger(input.localSequence) || input.localSequence < 1) {
    throw new Error("localSequence must be a positive integer");
  }
  if (input.studentId !== "student_1") {
    throw new Error("studentId must be student_1");
  }
}

function requireText(value: string, fieldName: string): void {
  if (!value.trim()) {
    throw new Error(`${fieldName} is required`);
  }
}

function requireIsoDate(value: string, fieldName: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${fieldName} must be a valid date`);
  }
}

function requireTargetMinutes(value: number): void {
  const testDurationAllowed =
    process.env.EXPO_PUBLIC_FOCUS_TEST_MODE === "true" && value === 1;
  if (!Number.isInteger(value) || (!testDurationAllowed && (value < 25 || value > 120))) {
    throw new Error("targetMinutes must be between 25 and 120");
  }
}
