import { StudyTask, TaskStatus } from "@/types";
import { taskStatusRank } from "@/utils/progress";

export function chooseTaskStatus(currentStatus: TaskStatus, incomingStatus: TaskStatus): TaskStatus {
  return taskStatusRank[incomingStatus] > taskStatusRank[currentStatus]
    ? incomingStatus
    : currentStatus;
}

export function mergeTaskEditWithDelete(currentTask: StudyTask, incomingTask: StudyTask): StudyTask {
  // Next phase:
  // Preserve tombstones on the server. If either side says deleted, deleted wins.
  if (currentTask.deleted || incomingTask.deleted) {
    return { ...currentTask, deleted: true };
  }

  return {
    ...currentTask,
    status: chooseTaskStatus(currentTask.status, incomingTask.status)
  };
}
