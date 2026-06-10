import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  createFocusSessionCompletedOperation,
  createFocusSessionFailedOperation
} from "@/features/sync/operationTemplates";
import {
  getRemainingSeconds,
  hasExceededAwayGracePeriod
} from "@/features/focus/sessionTiming";
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
      if (nextState !== "active" && appStateRef.current === "active") {
        awayStartedAtRef.current ??= Date.now();
      }
      appStateRef.current = nextState;
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
      const completedAtIso = new Date().toISOString();
      dispatch(completeSession(completedAtIso));
      dispatch(
        enqueueOperation(
          createFocusSessionCompletedOperation({
            deviceId: session.deviceId,
            completedAtIso,
            localSequence: pendingOperationCount + 1,
            sessionId,
            startedAtIso: session.startedAtIso,
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
      const failedAtIso = new Date().toISOString();
      dispatch(failSession({ failedAtIso, reason }));
      dispatch(
        enqueueOperation(
          createFocusSessionFailedOperation({
            deviceId: session.deviceId,
            failedAtIso,
            localSequence: pendingOperationCount + 1,
            reason,
            sessionId,
            startedAtIso: session.startedAtIso,
            studentId,
            targetMinutes: session.targetMinutes
          })
        )
      );
    }

    function checkSession() {
      const now = Date.now();
      const isAway = appStateRef.current !== "active" || pathname !== "/focus";
      if (isAway) {
        awayStartedAtRef.current ??= now;
        if (hasExceededAwayGracePeriod(awayStartedAtRef.current, now)) {
          finalizeFailure("app_switch");
        }
        return;
      }

      if (awayStartedAtRef.current !== null) {
        if (hasExceededAwayGracePeriod(awayStartedAtRef.current, now)) {
          finalizeFailure("app_switch");
          return;
        }
        awayStartedAtRef.current = null;
      }

      if (getRemainingSeconds(session, now) === 0) {
        finalizeSuccess();
      }
    }

    checkSession();
    const intervalId = setInterval(checkSession, 250);
    return () => clearInterval(intervalId);
  }, [currentSession, dispatch, pathname, pendingOperationCount, studentId]);

  return null;
}
