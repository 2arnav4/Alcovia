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
    startSession(state, action: PayloadAction<FocusSession>) {
      state.currentSession = action.payload;
    },
    completeSession(state, action: PayloadAction<string>) {
      if (!state.currentSession) {
        return;
      }

      const completedSession: FocusSession = {
        ...state.currentSession,
        status: "success",
        completedAtIso: action.payload
      };

      state.focusSessions.unshift(completedSession);
      state.currentSession = null;
      state.coins += 50;
      state.streak += 1;
      state.todayFocusMinutes += completedSession.targetMinutes;
    },
    failSession(
      state,
      action: PayloadAction<{ failedAtIso: string; reason: FocusFailureReason }>
    ) {
      if (!state.currentSession) {
        return;
      }

      state.focusSessions.unshift({
        ...state.currentSession,
        status: "failed",
        failedAtIso: action.payload.failedAtIso,
        failureReason: action.payload.reason
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
      const serverCurrentSession = state.currentSession
        ? action.payload.focusSessions.find(
            (session) => session.sessionId === state.currentSession?.sessionId
          )
        : null;

      state.focusSessions = action.payload.focusSessions.filter(
        (session) => session.status !== "running"
      );
      state.coins = action.payload.student.coins;
      state.streak = action.payload.student.streak;
      state.todayFocusMinutes = action.payload.student.todayFocusMinutes;
      if (serverCurrentSession && serverCurrentSession.status !== "running") {
        state.currentSession = null;
      }
    },
    resetFocusState() {
      return initialState;
    }
  }
});

export const {
  completeSession,
  failSession,
  applyServerFocusState,
  hydrateFocusState,
  resetFocusState,
  setSelectedDuration,
  startSession
} = focusSlice.actions;
export default focusSlice.reducer;
