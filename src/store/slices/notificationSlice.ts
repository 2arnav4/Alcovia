import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NotificationLog } from "@/types";

export interface NotificationSliceState {
  notificationLogs: NotificationLog[];
}

const initialState: NotificationSliceState = {
  notificationLogs: [
    {
      id: "placeholder-notification",
      message: "n8n/mock notifications will appear here after sync is implemented.",
      createdAtIso: new Date().toISOString()
    }
  ]
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotificationLog(state, action: PayloadAction<NotificationLog>) {
      state.notificationLogs.unshift(action.payload);
    },
    hydrateNotificationState(_state, action: PayloadAction<NotificationSliceState>) {
      return action.payload;
    },
    applyServerNotifications(state, action: PayloadAction<NotificationLog[]>) {
      state.notificationLogs = action.payload.length > 0 ? action.payload : state.notificationLogs;
    },
    resetNotificationState() {
      return initialState;
    }
  }
});

export const {
  addNotificationLog,
  applyServerNotifications,
  hydrateNotificationState,
  resetNotificationState
} =
  notificationSlice.actions;
export default notificationSlice.reducer;
