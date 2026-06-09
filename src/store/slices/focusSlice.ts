import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FocusFailureReason, FocusSession, StudentState } from "@/types";

export interface FocusSliceState {
  selectedDuration: number;
  currentSession: FocusSession | null;
  focusSessions: FocusSession[];
  coins: number;
  streak: number;
  todayFocusMinutes: number;
}

const initialState: FocusSliceState = {
  selectedDuration: 25,
  currentSession: null,
  focusSessions: [],
  coins: 120,
  streak: 3,
  todayFocusMinutes: 40
};

const focusSlice = createSlice({
  name: "focus",
  initialState,
  reducers: {
    setSelectedDuration(state, action: PayloadAction<number>) {
      state.selectedDuration = action.payload;
    },
    startSessionPlaceholder(state, action: PayloadAction<FocusSession>) {
      state.currentSession = action.payload;
    },
    completeDemoSession(state) {
      if (!state.currentSession) {
        return;
      }

      const completedSession: FocusSession = {
        ...state.currentSession,
        status: "success",
        completedAtIso: new Date().toISOString()
      };

      state.focusSessions.unshift(completedSession);
      state.currentSession = null;
      state.coins += 50;
      state.streak += 1;
      state.todayFocusMinutes += completedSession.targetMinutes;
    },
    failSessionPlaceholder(state, action: PayloadAction<FocusFailureReason>) {
      if (!state.currentSession) {
        return;
      }

      state.focusSessions.unshift({
        ...state.currentSession,
        status: "failed",
        failedAtIso: new Date().toISOString(),
        failureReason: action.payload
      });
      state.currentSession = null;
    },
    hydrateFocusState(_state, action: PayloadAction<FocusSliceState>) {
      return action.payload;
    },
    applyServerFocusState(
      state,
      action: PayloadAction<{ focusSessions: FocusSession[]; student: StudentState }>
    ) {
      state.focusSessions = action.payload.focusSessions;
      state.coins = action.payload.student.coins;
      state.streak = action.payload.student.streak;
      state.todayFocusMinutes = action.payload.student.todayFocusMinutes;
      state.currentSession = null;
    },
    resetFocusState() {
      return initialState;
    }
  }
});

export const {
  completeDemoSession,
  failSessionPlaceholder,
  applyServerFocusState,
  hydrateFocusState,
  resetFocusState,
  setSelectedDuration,
  startSessionPlaceholder
} = focusSlice.actions;
export default focusSlice.reducer;
