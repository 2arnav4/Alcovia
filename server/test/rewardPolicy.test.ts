import assert from "node:assert/strict";
import test from "node:test";
import { shouldAdvanceDailyStreak } from "../src/services/rewardPolicy";

test("the first successful session advances the streak", () => {
  assert.equal(shouldAdvanceDailyStreak(null, "2026-06-11"), true);
});

test("another successful session on the same day does not advance the streak", () => {
  assert.equal(shouldAdvanceDailyStreak("2026-06-11", "2026-06-11"), false);
});

test("a successful session on another day advances the streak", () => {
  assert.equal(shouldAdvanceDailyStreak("2026-06-11", "2026-06-12"), true);
});
