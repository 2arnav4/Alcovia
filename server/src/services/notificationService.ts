import { notificationLogs } from "../data/serverState";
import { NotificationLog } from "../types";
import { createServerId } from "../utils/ids";

export function getNotificationLogs(): NotificationLog[] {
  return notificationLogs;
}

export function recordNotificationFromSink(payload: Partial<NotificationLog> & { message?: string }) {
  const notification: NotificationLog = {
    id: payload.id ?? createServerId("notification"),
    sessionId: payload.sessionId,
    message: payload.message ?? "Notification received.",
    createdAtIso: payload.createdAtIso ?? new Date().toISOString()
  };

  notificationLogs.unshift(notification);
  return notification;
}
