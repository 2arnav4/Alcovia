export function getFocusDate(isoDate = new Date().toISOString()): string {
  return isoDate.slice(0, 10);
}
