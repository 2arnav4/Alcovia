import { notificationLogs, persistServerData } from "../data/serverState";
import { NotificationLog } from "../types";
import { createServerId } from "../utils/ids";

export function getNotificationLogs(): NotificationLog[] {
  return notificationLogs;
}

export function recordNotificationFromSink(payload: Partial<NotificationLog> & { message?: string }) {
  const existingNotification = payload.sessionId
    ? notificationLogs.find((notification) => notification.sessionId === payload.sessionId)
    : undefined;

  if (existingNotification) {
    return existingNotification;
  }

  const notification: NotificationLog = {
    id: payload.id ?? createServerId("notification"),
    sessionId: payload.sessionId,
    message: payload.message ?? "Notification received.",
    createdAtIso: payload.createdAtIso ?? new Date().toISOString()
  };

  notificationLogs.unshift(notification);
  persistServerData();
  return notification;
}
