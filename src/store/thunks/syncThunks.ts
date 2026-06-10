import { createAsyncThunk } from "@reduxjs/toolkit";
import { syncPendingOperations } from "@/features/sync/syncClient";
import { fetchNotificationState } from "@/services/api";
import { RootState } from "@/store";
import { applyServerFocusState } from "@/store/slices/focusSlice";
import { applyServerNotifications } from "@/store/slices/notificationSlice";
import { applyServerSubjects } from "@/store/slices/syllabusSlice";
import {
  clearAcceptedOperations,
  setLastSyncError,
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
    thunkApi.dispatch(setLastSyncError(null));

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
      let notificationState = {
        notifications: response.notifications,
        automationDeliveries: response.automationDeliveries
      };

      const completedSessionIds = new Set(
        state.sync.pendingOperations
          .filter((operation) => operation.type === "focus_session_completed")
          .map((operation) => operation.payload.sessionId)
          .filter((sessionId): sessionId is string => typeof sessionId === "string")
      );

      if (completedSessionIds.size > 0) {
        notificationState = await waitForNotifications(completedSessionIds, notificationState);
      }

      const relevantDelivery = notificationState.automationDeliveries.find((delivery) =>
        completedSessionIds.has(delivery.event.sessionId)
      ) ?? notificationState.automationDeliveries.at(-1);

      thunkApi.dispatch(applyServerNotifications(notificationState.notifications));
      thunkApi.dispatch(
        setServerStatePreview({
          automationAttempts: relevantDelivery?.attempts ?? 0,
          automationStatus: relevantDelivery?.status ?? "No event yet",
          focusSessions: response.state.focusSessions.length,
          notifications: notificationState.notifications.length,
          serverVersion: response.serverVersion,
          student: response.state.student,
          subjects: response.state.subjects.length
        })
      );
      thunkApi.dispatch(setSyncStatus("synced"));
      thunkApi.dispatch(setLastSyncError(null));
    } catch (error) {
      const isStillOnline = thunkApi.getState().app.isOnline;
      thunkApi.dispatch(setSyncStatus(isStillOnline ? "retry_needed" : "offline"));
      thunkApi.dispatch(
        setLastSyncError(
          isStillOnline
            ? getSyncErrorMessage(error)
            : "Sync stopped because this device went offline. Your changes are still saved."
        )
      );
    }
  },
  {
    condition: (_argument, thunkApi) => thunkApi.getState().sync.syncStatus !== "syncing"
  }
);

function getSyncErrorMessage(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "Sync timed out or lost its connection. Your changes are still saved. Try again.";
  }

  return "Sync could not finish. Your changes are still saved. Try again.";
}

async function waitForNotifications(
  expectedSessionIds: Set<string>,
  initialState: Awaited<ReturnType<typeof fetchNotificationState>>
) {
  let notificationState = initialState;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const receivedSessionIds = new Set(
      notificationState.notifications.map((notification) => notification.sessionId)
    );
    if (Array.from(expectedSessionIds).every((sessionId) => receivedSessionIds.has(sessionId))) {
      return notificationState;
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
    try {
      notificationState = await fetchNotificationState();
    } catch {
      return notificationState;
    }
  }

  return notificationState;
}
