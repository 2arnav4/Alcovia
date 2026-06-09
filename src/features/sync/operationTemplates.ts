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
  input: OperationBaseInput & { sessionId: string; targetMinutes: number }
): SyncOperation {
  return {
    operationId: createLocalId("op_focus_complete", input.deviceId),
    deviceId: input.deviceId,
    studentId: input.studentId,
    type: "focus_session_completed",
    localSequence: input.localSequence,
    payload: {
      sessionId: input.sessionId,
      targetMinutes: input.targetMinutes
    }
  };
}

export function createFocusSessionFailedOperation(
  input: OperationBaseInput & { reason: FocusFailureReason; sessionId: string }
): SyncOperation {
  return {
    operationId: createLocalId("op_focus_fail", input.deviceId),
    deviceId: input.deviceId,
    studentId: input.studentId,
    type: "focus_session_failed",
    localSequence: input.localSequence,
    payload: {
      sessionId: input.sessionId,
      reason: input.reason
    }
  };
}
