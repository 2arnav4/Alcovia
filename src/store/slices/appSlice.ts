import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DeviceId, StudentId } from "@/types";

interface AppSliceState {
  studentId: StudentId;
  selectedDeviceId: DeviceId;
  isOnline: boolean;
  deviceOnline: Record<DeviceId, boolean>;
}

const initialState: AppSliceState = {
  studentId: "student_1",
  selectedDeviceId: "phone",
  isOnline: true,
  deviceOnline: {
    laptop: true,
    phone: true,
    tablet: true
  }
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setSelectedDeviceId(state, action: PayloadAction<DeviceId>) {
      state.selectedDeviceId = action.payload;
      state.isOnline = state.deviceOnline[action.payload];
    },
    setIsOnline(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
      state.deviceOnline[state.selectedDeviceId] = action.payload;
    }
  }
});

export const { setIsOnline, setSelectedDeviceId } = appSlice.actions;
export default appSlice.reducer;
