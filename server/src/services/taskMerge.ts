import { StudyTask, TaskStatus } from "../types";

const TASK_STATUS_RANK: Record<TaskStatus, number> = {
  not_started: 0,
  in_progress: 1,
  done: 2
};

export function mergeTaskStatus(task: StudyTask, incomingStatus: TaskStatus): void {
  if (task.deleted) {
    return;
  }

  if (TASK_STATUS_RANK[incomingStatus] >= TASK_STATUS_RANK[task.status]) {
    task.status = incomingStatus;
  }
}

export function mergeTaskDeletion(task: StudyTask): void {
  task.deleted = true;
  task.status = "not_started";
}
