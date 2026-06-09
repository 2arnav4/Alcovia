export interface N8nFocusSuccessPayload {
  coinsAwarded: number;
  dedupeKey: string;
  sessionId: string;
  streak: number;
  studentId: "student_1";
}

export async function sendFocusSuccessToN8n(_payload: N8nFocusSuccessPayload): Promise<void> {
  // Next phase:
  // POST to the n8n webhook only after the backend confirms the session success once.
  // The dedupeKey should be stable, usually `focus_success:${sessionId}`.
}
