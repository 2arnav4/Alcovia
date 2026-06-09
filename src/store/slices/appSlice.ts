import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DeviceId, StudentId } from "@/types";

interface AppSliceState {
  studentId: StudentId;
  selectedDeviceId: DeviceId;
  isOnline: boolean;
}

const initialState: AppSliceState = {
  studentId: "student_1",
  selectedDeviceId: "phone",
  isOnline: true
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setSelectedDeviceId(state, action: PayloadAction<DeviceId>) {
      state.selectedDeviceId = action.payload;
    },
    setIsOnline(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    }
  }
});

export const { setIsOnline, setSelectedDeviceId } = appSlice.actions;
export default appSlice.reducer;
