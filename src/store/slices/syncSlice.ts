import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConflictNotice, SyncOperation } from "@/types";

type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "retry_needed";

export interface SyncSliceState {
  pendingOperations: SyncOperation[];
  lastKnownServerVersion: number;
  syncStatus: SyncStatus;
  lastSyncError: string | null;
  conflicts: ConflictNotice[];
  serverStatePreview: Record<string, unknown> | null;
}

const initialState: SyncSliceState = {
  pendingOperations: [],
  lastKnownServerVersion: 0,
  syncStatus: "idle",
  lastSyncError: null,
  conflicts: [],
  serverStatePreview: null
};

const syncSlice = createSlice({
  name: "sync",
  initialState,
  reducers: {
    enqueueOperation(state, action: PayloadAction<SyncOperation>) {
      state.pendingOperations.push(action.payload);
      if (state.syncStatus === "synced") {
        state.syncStatus = "idle";
      }
    },
    setSyncStatus(state, action: PayloadAction<SyncStatus>) {
      state.syncStatus = action.payload;
    },
    setLastSyncError(state, action: PayloadAction<string | null>) {
      state.lastSyncError = action.payload;
    },
    setConflicts(state, action: PayloadAction<ConflictNotice[]>) {
      state.conflicts = action.payload;
    },
    setServerStatePreview(state, action: PayloadAction<Record<string, unknown> | null>) {
      state.serverStatePreview = action.payload;
    },
    setLastKnownServerVersion(state, action: PayloadAction<number>) {
      state.lastKnownServerVersion = action.payload;
    },
    hydrateSyncState(_state, action: PayloadAction<SyncSliceState>) {
      const savedStatus = action.payload.syncStatus as SyncStatus | "error";
      return {
        ...initialState,
        ...action.payload,
        conflicts: action.payload.conflicts ?? [],
        lastSyncError: action.payload.lastSyncError ?? null,
        syncStatus: savedStatus === "error" ? "retry_needed" : savedStatus
      };
    },
    clearAcceptedOperations(state, action: PayloadAction<string[]>) {
      const acceptedOperationIds = new Set(action.payload);
      state.pendingOperations = state.pendingOperations.filter(
        (operation) => !acceptedOperationIds.has(operation.operationId)
      );
    },
    clearPendingOperations(state) {
      state.pendingOperations = [];
    },
    resetSyncState() {
      return initialState;
    }
  }
});

export const {
  clearAcceptedOperations,
  clearPendingOperations,
  enqueueOperation,
  hydrateSyncState,
  resetSyncState,
  setConflicts,
  setLastSyncError,
  setLastKnownServerVersion,
  setServerStatePreview,
  setSyncStatus
} = syncSlice.actions;
export default syncSlice.reducer;
