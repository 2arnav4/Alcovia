import { postSync } from "@/services/api";
import { SyncRequest, SyncResponse } from "@/types";

export async function syncPendingOperations(request: SyncRequest): Promise<SyncResponse> {
  return postSync(request);
}
