import assert from "node:assert/strict";
import test from "node:test";
import { mergeTaskDeletion, mergeTaskStatus } from "../src/services/taskMerge";
import { StudyTask, TaskStatus } from "../src/types";

type TaskOperation =
  | { operationId: string; type: "delete" }
  | { operationId: string; type: "status"; status: TaskStatus };

function applyOperations(operations: TaskOperation[]): StudyTask {
  const task: StudyTask = {
    id: "fuzz-task",
    title: "Fuzz task",
    status: "not_started"
  };
  const appliedOperationIds = new Set<string>();

  for (const operation of operations) {
    if (appliedOperationIds.has(operation.operationId)) {
      continue;
    }
    appliedOperationIds.add(operation.operationId);

    if (operation.type === "delete") {
      mergeTaskDeletion(task);
    } else {
      mergeTaskStatus(task, operation.status);
    }
  }

  return task; // return the modified task
}

function shuffled<T>(values: T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

test("random offline task operations converge in every tested arrival order", () => {
  const statuses: TaskStatus[] = ["not_started", "in_progress", "done"];

  for (let scenario = 0; scenario < 500; scenario += 1) {
    const operationCount = 2 + Math.floor(Math.random() * 10);
    const operations: TaskOperation[] = [];

    for (let index = 0; index < operationCount; index += 1) {
      const operationId = `scenario-${scenario}-operation-${index}`;
      if (Math.random() < 0.2) {
        operations.push({ operationId, type: "delete" });
      } else {
        operations.push({
          operationId,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          type: "status"
        });
      }

      if (Math.random() < 0.25) {
        operations.push(operations.at(-1)!);
      }
    }

    const expected = applyOperations(operations);
    for (let replay = 0; replay < 20; replay += 1) {
      assert.deepEqual(applyOperations(shuffled(operations)), expected);
    }
  }
});

test("delete wins over every status edit", () => {
  const operations: TaskOperation[] = [
    { operationId: "phone-done", status: "done", type: "status" },
    { operationId: "laptop-delete", type: "delete" },
    { operationId: "late-edit", status: "in_progress", type: "status" }
  ];

  assert.deepEqual(applyOperations(operations), applyOperations(operations.reverse()));
  assert.equal(applyOperations(operations).deleted, true);
});
