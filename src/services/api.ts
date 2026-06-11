import { NotificationStateResponse, SyncRequest, SyncResponse } from "@/types";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const SYNC_TIMEOUT_MS = 30_000;
let activeSyncController: AbortController | null = null;

export async function fetchServerState() {
  const response = await fetch(`${API_BASE_URL}/api/state`);
  if (!response.ok) {
    throw new Error("Unable to fetch server state");
  }
  return response.json();
}

export async function fetchNotificationState(): Promise<NotificationStateResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error("Unable to fetch notification state");
    }
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function postSync(request: SyncRequest): Promise<SyncResponse> {
  const controller = new AbortController();
  activeSyncController = controller;
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    if (activeSyncController === controller) {
      activeSyncController = null;
    }
  }

  if (!response.ok) {
    throw new Error("Sync request failed");
  }

  return response.json();
}

export async function resetDemoServer(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/reset`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error("Unable to reset demo server");
  }
}

export function cancelActiveSyncRequest(): void {
  activeSyncController?.abort();
}
