import { DeviceId } from "@/types";

export function createLocalId(prefix: string, deviceId: DeviceId): string {
  return `${prefix}_${deviceId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
