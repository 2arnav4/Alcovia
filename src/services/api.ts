import { SyncRequest, SyncResponse } from "@/types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function fetchServerState() {
  const response = await fetch(`${API_BASE_URL}/api/state`);
  if (!response.ok) {
    throw new Error("Unable to fetch server state");
  }
  return response.json();
}

export async function postSync(request: SyncRequest): Promise<SyncResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error("Sync request failed");
  }

  return response.json();
}
