export function shouldAdvanceDailyStreak(
  lastStreakDate: string | null,
  completionDate: string
): boolean {
  return lastStreakDate !== completionDate;
}
