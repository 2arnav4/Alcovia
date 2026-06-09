import { SyncRequest, SyncResponse } from "@/types";
import { postSync } from "@/services/api";

export async function syncPendingOperations(request: SyncRequest): Promise<SyncResponse> {
  // Next phase:
  // 1. Send pending operations for the current device namespace.
  // 2. Clear only operationIds accepted by the backend.
  // 3. Replace local canonical state with response.state.
  // 4. Keep unaccepted operations queued for retry.
  return postSync(request);
}
