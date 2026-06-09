import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import {
  loadPersistedDeviceState,
  savePersistedDeviceState,
  selectPersistableState
} from "@/services/devicePersistence";
import { hydrateFocusState, resetFocusState } from "@/store/slices/focusSlice";
import {
  hydrateNotificationState,
  resetNotificationState
} from "@/store/slices/notificationSlice";
import { hydrateSyllabusState, resetSyllabusState } from "@/store/slices/syllabusSlice";
import { hydrateSyncState, resetSyncState } from "@/store/slices/syncSlice";
import { DeviceId } from "@/types";

export function StatePersistenceGate({ children }: PropsWithChildren) {
  const dispatch = useDispatch<AppDispatch>();
  const selectedDeviceId = useSelector((state: RootState) => state.app.selectedDeviceId);
  const persistableState = useSelector(selectPersistableState, shallowEqual);
  const [hydratedDeviceId, setHydratedDeviceId] = useState<DeviceId | null>(null);
  const isHydratingRef = useRef(false);

  useEffect(() => {
    let isActive = true;
    isHydratingRef.current = true;
    setHydratedDeviceId(null);

    loadPersistedDeviceState(selectedDeviceId)
      .then((savedState) => {
        if (!isActive) {
          return;
        }

        if (savedState) {
          dispatch(hydrateFocusState(savedState.focus));
          dispatch(hydrateNotificationState(savedState.notifications));
          dispatch(hydrateSyllabusState(savedState.syllabus));
          dispatch(hydrateSyncState(savedState.sync));
        } else {
          dispatch(resetFocusState());
          dispatch(resetNotificationState());
          dispatch(resetSyllabusState());
          dispatch(resetSyncState());
        }

        setHydratedDeviceId(selectedDeviceId);
      })
      .finally(() => {
        if (isActive) {
          isHydratingRef.current = false;
        }
      });

    return () => {
      isActive = false;
    };
  }, [dispatch, selectedDeviceId]);

  useEffect(() => {
    if (isHydratingRef.current || hydratedDeviceId !== selectedDeviceId) {
      return;
    }

    void savePersistedDeviceState(selectedDeviceId, persistableState);
  }, [hydratedDeviceId, persistableState, selectedDeviceId]);

  return <>{children}</>;
}
