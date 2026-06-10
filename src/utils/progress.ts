import { Chapter, Subject, TaskStatus } from "@/types";

export const taskStatusRank: Record<TaskStatus, number> = {
  not_started: 0,
  in_progress: 1,
  done: 2
};

export function getChapterProgress(chapter: Chapter): number {
  const activeTasks = chapter.tasks.filter((task) => !task.deleted);
  if (activeTasks.length === 0) {
    return 0;
  }

  const completedTasks = activeTasks.filter((task) => task.status === "done").length;
  return Math.round((completedTasks / activeTasks.length) * 100);
}

export function getSubjectProgress(subject: Subject): number {
  const activeTasks = subject.chapters.flatMap((chapter) =>
    chapter.tasks.filter((task) => !task.deleted)
  );
  if (activeTasks.length === 0) {
    return 0;
  }

  const completedTasks = activeTasks.filter((task) => task.status === "done").length;
  return Math.round((completedTasks / activeTasks.length) * 100);
}
