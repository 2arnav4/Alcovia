import { configureStore } from "@reduxjs/toolkit";
import appReducer from "@/store/slices/appSlice";
import focusReducer from "@/store/slices/focusSlice";
import notificationReducer from "@/store/slices/notificationSlice";
import syllabusReducer from "@/store/slices/syllabusSlice";
import syncReducer from "@/store/slices/syncSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    focus: focusReducer,
    notifications: notificationReducer,
    syllabus: syllabusReducer,
    sync: syncReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
