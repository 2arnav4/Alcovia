import assert from "node:assert/strict";
import test from "node:test";
import {
  FOCUS_AWAY_GRACE_MS,
  hasRecoveredSessionExceededGracePeriod
} from "../../src/features/focus/sessionTiming";

const LAST_ACTIVE_AT = "2026-06-10T10:00:00.000Z";
const LAST_ACTIVE_TIME = Date.parse(LAST_ACTIVE_AT);

test("a recovered session resumes inside the five second grace period", () => {
  assert.equal(
    hasRecoveredSessionExceededGracePeriod(
      LAST_ACTIVE_AT,
      LAST_ACTIVE_TIME + FOCUS_AWAY_GRACE_MS - 1
    ),
    false
  );
});

test("a recovered session fails at or after the five second boundary", () => {
  assert.equal(
    hasRecoveredSessionExceededGracePeriod(
      LAST_ACTIVE_AT,
      LAST_ACTIVE_TIME + FOCUS_AWAY_GRACE_MS
    ),
    true
  );
  assert.equal(
    hasRecoveredSessionExceededGracePeriod(
      LAST_ACTIVE_AT,
      LAST_ACTIVE_TIME + FOCUS_AWAY_GRACE_MS + 60_000
    ),
    true
  );
});
