import { createAsyncThunk } from "@reduxjs/toolkit";
import { syncPendingOperations } from "@/features/sync/syncClient";
import { RootState } from "@/store";
import { applyServerFocusState } from "@/store/slices/focusSlice";
import { applyServerNotifications } from "@/store/slices/notificationSlice";
import { applyServerSubjects } from "@/store/slices/syllabusSlice";
import {
  clearAcceptedOperations,
  setLastKnownServerVersion,
  setServerStatePreview,
  setSyncStatus
} from "@/store/slices/syncSlice";

export const runSyncNow = createAsyncThunk<void, void, { state: RootState }>(
  "sync/runSyncNow",
  async (_argument, thunkApi) => {
    const state = thunkApi.getState();

    if (!state.app.isOnline) {
      thunkApi.dispatch(setSyncStatus("offline"));
      return;
    }

    thunkApi.dispatch(setSyncStatus("syncing"));

    try {
      const response = await syncPendingOperations({
        studentId: state.app.studentId,
        deviceId: state.app.selectedDeviceId,
        operations: state.sync.pendingOperations,
        lastKnownServerVersion: state.sync.lastKnownServerVersion
      });

      thunkApi.dispatch(clearAcceptedOperations(response.acceptedOperationIds));
      thunkApi.dispatch(setLastKnownServerVersion(response.serverVersion));
      thunkApi.dispatch(applyServerFocusState(response.state));
      thunkApi.dispatch(applyServerSubjects(response.state.subjects));
      thunkApi.dispatch(applyServerNotifications(response.notifications));
      thunkApi.dispatch(
        setServerStatePreview({
          focusSessions: response.state.focusSessions.length,
          notifications: response.notifications.length,
          serverVersion: response.serverVersion,
          student: response.state.student,
          subjects: response.state.subjects.length
        })
      );
      thunkApi.dispatch(setSyncStatus("synced"));
    } catch (error) {
      thunkApi.dispatch(setSyncStatus("error"));
      throw error;
    }
  }
);
