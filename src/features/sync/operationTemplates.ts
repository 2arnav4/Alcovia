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
