import { RootState } from "@/store";
import { FocusSliceState } from "@/store/slices/focusSlice";
import { NotificationSliceState } from "@/store/slices/notificationSlice";
import { SyllabusSliceState } from "@/store/slices/syllabusSlice";
import { SyncSliceState } from "@/store/slices/syncSlice";
import { DeviceId } from "@/types";
import { loadDeviceJson, saveDeviceJson } from "@/services/storage";

const DEVICE_STATE_KEY = "redux-state";

export interface PersistedDeviceState {
  focus: FocusSliceState;
  notifications: NotificationSliceState;
  syllabus: SyllabusSliceState;
  sync: SyncSliceState;
}

export function selectPersistableState(state: RootState): PersistedDeviceState {
  return {
    focus: state.focus,
    notifications: state.notifications,
    syllabus: state.syllabus,
    sync: state.sync
  };
}

export function loadPersistedDeviceState(deviceId: DeviceId) {
  return loadDeviceJson<PersistedDeviceState>(deviceId, DEVICE_STATE_KEY);
}

export function savePersistedDeviceState(deviceId: DeviceId, state: PersistedDeviceState) {
  return saveDeviceJson(deviceId, DEVICE_STATE_KEY, state);
}
