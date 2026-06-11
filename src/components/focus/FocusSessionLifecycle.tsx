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
  hasExceededAwayGracePeriod,
  hasRecoveredSessionExceededGracePeriod
} from "@/features/focus/sessionTiming";
import { AppDispatch, RootState } from "@/store";
import {
  completeSession,
  failSession,
  markSessionActive,
  markSessionAway
} from "@/store/slices/focusSlice";
import { enqueueOperation } from "@/store/slices/syncSlice";
import { FocusFailureReason } from "@/types";

export function FocusSessionLifecycle() {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const {
    currentSession,
    currentSessionAwayStartedAtIso,
    currentSessionLastActiveAtIso
  } = useSelector((state: RootState) => state.focus);
  const studentId = useSelector((state: RootState) => state.app.studentId);
  const pendingOperationCount = useSelector(
    (state: RootState) => state.sync.pendingOperations.length
  );
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const awayStartedAtRef = useRef<number | null>(null);
  const awayTimePersistedRef = useRef(false);
  const finalizedSessionIdsRef = useRef(new Set<string>());
  const recoveryCheckedSessionIdsRef = useRef(new Set<string>());
  const lastHeartbeatAtRef = useRef(0);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" && appStateRef.current === "active") {
        const awayStartedAt = Date.now();
        awayStartedAtRef.current ??= awayStartedAt;
        awayTimePersistedRef.current = true;
        dispatch(markSessionAway(new Date(awayStartedAt).toISOString()));
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [dispatch, pathname]);

  useEffect(() => {
    if (!currentSession) {
      awayStartedAtRef.current = null;
      awayTimePersistedRef.current = false;
      return;
    }

    const session = currentSession;
    const sessionId = session.sessionId;
    const savedAwayStartedAt = currentSessionAwayStartedAtIso
      ? Date.parse(currentSessionAwayStartedAtIso)
      : null;
    if (savedAwayStartedAt !== null && Number.isFinite(savedAwayStartedAt)) {
      awayStartedAtRef.current = savedAwayStartedAt;
      awayTimePersistedRef.current = true;
    }

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
        if (!awayTimePersistedRef.current) {
          awayTimePersistedRef.current = true;
          dispatch(markSessionAway(new Date(awayStartedAtRef.current).toISOString()));
        }
        if (hasExceededAwayGracePeriod(awayStartedAtRef.current, now)) {
          finalizeFailure("app_switch");
        }
        return;
      }

      if (!recoveryCheckedSessionIdsRef.current.has(sessionId)) {
        recoveryCheckedSessionIdsRef.current.add(sessionId);
        const lastActiveAtIso = currentSessionLastActiveAtIso ?? session.startedAtIso;
        if (
          awayStartedAtRef.current === null &&
          hasRecoveredSessionExceededGracePeriod(lastActiveAtIso, now)
        ) {
          finalizeFailure("app_switch");
          return;
        }
      }

      if (awayStartedAtRef.current !== null) {
        if (hasExceededAwayGracePeriod(awayStartedAtRef.current, now)) {
          finalizeFailure("app_switch");
          return;
        }
        awayStartedAtRef.current = null;
        awayTimePersistedRef.current = false;
      }

      if (now - lastHeartbeatAtRef.current >= 1_000) {
        lastHeartbeatAtRef.current = now;
        dispatch(markSessionActive(new Date(now).toISOString()));
      }

      if (getRemainingSeconds(session, now) === 0) {
        finalizeSuccess();
      }
    }

    checkSession();
    const intervalId = setInterval(checkSession, 250);
    return () => clearInterval(intervalId);
  }, [
    currentSession,
    dispatch,
    pathname,
    pendingOperationCount,
    studentId
  ]);

  return null;
}
