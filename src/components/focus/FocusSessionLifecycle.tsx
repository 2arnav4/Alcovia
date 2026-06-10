import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  createFocusSessionCompletedOperation,
  createFocusSessionFailedOperation
} from "@/features/sync/operationTemplates";
import { FOCUS_AWAY_GRACE_MS, getRemainingSeconds } from "@/features/focus/sessionTiming";
import { AppDispatch, RootState } from "@/store";
import { completeSession, failSession } from "@/store/slices/focusSlice";
import { enqueueOperation } from "@/store/slices/syncSlice";
import { FocusFailureReason } from "@/types";

export function FocusSessionLifecycle() {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const currentSession = useSelector((state: RootState) => state.focus.currentSession);
  const studentId = useSelector((state: RootState) => state.app.studentId);
  const pendingOperationCount = useSelector(
    (state: RootState) => state.sync.pendingOperations.length
  );
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const awayStartedAtRef = useRef<number | null>(null);
  const finalizedSessionIdsRef = useRef(new Set<string>());

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active" && pathname === "/focus") {
        awayStartedAtRef.current = null;
      }
    });

    return () => subscription.remove();
  }, [pathname]);

  useEffect(() => {
    if (!currentSession) {
      awayStartedAtRef.current = null;
      return;
    }

    const session = currentSession;
    const sessionId = session.sessionId;

    function finalizeSuccess() {
      if (finalizedSessionIdsRef.current.has(sessionId)) {
        return;
      }

      finalizedSessionIdsRef.current.add(sessionId);
      dispatch(completeSession());
      dispatch(
        enqueueOperation(
          createFocusSessionCompletedOperation({
            deviceId: session.deviceId,
            localSequence: pendingOperationCount + 1,
            sessionId,
            studentId,
            targetMinutes: session.targetMinutes
          })
        )
      );
    }

    function finalizeFailure(reason: FocusFailureReason) {
      if (finalizedSessionIdsRef.current.has(sessionId)) {
        return;
      }

      finalizedSessionIdsRef.current.add(sessionId);
      dispatch(failSession(reason));
      dispatch(
        enqueueOperation(
          createFocusSessionFailedOperation({
            deviceId: session.deviceId,
            localSequence: pendingOperationCount + 1,
            reason,
            sessionId,
            studentId
          })
        )
      );
    }

    function checkSession() {
      const now = Date.now();
      if (getRemainingSeconds(session, now) === 0) {
        finalizeSuccess();
        return;
      }

      const isAway = appStateRef.current !== "active" || pathname !== "/focus";
      if (!isAway) {
        awayStartedAtRef.current = null;
        return;
      }

      awayStartedAtRef.current ??= now;
      if (now - awayStartedAtRef.current >= FOCUS_AWAY_GRACE_MS) {
        finalizeFailure("app_switch");
      }
    }

    checkSession();
    const intervalId = setInterval(checkSession, 250);
    return () => clearInterval(intervalId);
  }, [currentSession, dispatch, pathname, pendingOperationCount, studentId]);

  return null;
}
