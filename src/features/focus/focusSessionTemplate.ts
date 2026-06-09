import { AppStateStatus } from "react-native";
import { FocusFailureReason, FocusSession } from "@/types";

export interface FocusTimerTemplateInput {
  gracePeriodMs: number;
  now: () => number;
  onFail: (reason: FocusFailureReason) => void;
  session: FocusSession;
}

export function shouldCompleteFocusSession(_input: FocusTimerTemplateInput): boolean {
  // Next phase:
  // Compare elapsed focused time against session.targetMinutes.
  // Keep this deterministic so offline completion can be replayed safely.
  return false;
}

export function getFailureReasonFromAppState(
  _previousState: AppStateStatus,
  _nextState: AppStateStatus,
  _backgroundedForMs: number
): FocusFailureReason | null {
  // Next phase:
  // Return "app_switch" only when the app stayed backgrounded beyond the grace period.
  // Do not use this to award or sync rewards directly; emit an operation instead.
  return null;
}
