import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { seedSubjects } from "@/data/seed";
import { Subject, TaskStatus } from "@/types";

export interface SyllabusSliceState {
  subjects: Subject[];
}

const initialState: SyllabusSliceState = {
  subjects: seedSubjects
};

const syllabusSlice = createSlice({
  name: "syllabus",
  initialState,
  reducers: {
    updateTaskStatus(
      state,
      action: PayloadAction<{ taskId: string; status: TaskStatus }>
    ) {
      for (const subject of state.subjects) {
        for (const chapter of subject.chapters) {
          const task = chapter.tasks.find((candidate) => candidate.id === action.payload.taskId);
          if (task) {
            task.status = action.payload.status;
            return;
          }
        }
      }
    },
    hydrateSyllabusState(_state, action: PayloadAction<SyllabusSliceState>) {
      return action.payload;
    },
    applyServerSubjects(state, action: PayloadAction<Subject[]>) {
      state.subjects = action.payload;
    },
    resetSyllabusState() {
      return initialState;
    }
  }
});

export const { applyServerSubjects, hydrateSyllabusState, resetSyllabusState, updateTaskStatus } =
  syllabusSlice.actions;
export default syllabusSlice.reducer;
